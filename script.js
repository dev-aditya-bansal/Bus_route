// Route data - embedded directly in JavaScript
const route = [
    {lat: -6.19871, lng: 106.74193, sequence: 1, stop_name: 'Kembangan West Jakarta City Jakarta Indonesia', estimated_time: '11:00:00'},
    {lat: -6.23253, lng: 106.54487, sequence: 2, stop_name: 'Bitung Bitung Jaya Tangerang Regency Banten Indonesia', estimated_time: '11:02:00'},
    {lat: -6.18556, lng: 106.45467, sequence: 3, stop_name: 'Balaraja Tangerang Regency Banten Indonesia', estimated_time: '11:05:00'},
    {lat: -6.13811, lng: 106.29415, sequence: 4, stop_name: 'Kragilan Serang Regency Banten Indonesia', estimated_time: '11:07:00'},
    {lat: -6.12588, lng: 106.14047, sequence: 5, stop_name: 'Serang Serang City Banten Indonesia', estimated_time: '11:09:00'},
    {lat: -6.01872, lng: 106.0558, sequence: 6, stop_name: 'Cilegon Banten Indonesia', estimated_time: '11:11:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 7, stop_name: 'Masjid Al Asri PT. Chandra Asri Petrochemical Tbk Jalan Brigadir Jenderal Katamso Gunungsugih Cilegon Banten Indonesia', estimated_time: '11:13:00'}
];

// Global variables
let map, busMarker, animationTimeout, liveLocationInterval;
let isPlaying = false, index = 0, step = 0;
const STEPS_PER_SEGMENT = 60;
const DURATION_PER_SEGMENT = 2500; // Fallback duration in ms
const DELAY = DURATION_PER_SEGMENT / STEPS_PER_SEGMENT;
let currentSegmentDuration = DURATION_PER_SEGMENT; // Current segment duration based on ETA

// API Configuration
const API_BASE_URL = 'https://vsms-v2-public.mceasy.com/v1/vehicles';
const VEHICLE_ID = 81596;
const API_TOKEN = 'b5fU8a2Dc2y7zbacF4fccrFDTKeG27f3h5faua8dkDealKmYSRb5I0go3a2XUu0taiabbhuqba6ajLFTac48aSgcbf4bgJHej4fea6MQG6qUzr67gO4IL6L385syZJOW6kXbf75mFaLGuPxfmSV86A1aZg0p4RkayHOt2fC3TRPA6AV6zxaV7Ffz6F4DYKi4kv6Id7tS7FZa4SjKeRH9fktkhVBTV6yWOanlbc4kLafFecbbc9x6yOae60eGp8l8';
const FETCH_INTERVAL = 5000; // 5 seconds

// Distance Matrix API Configuration
const DISTANCE_MATRIX_API_KEY = 'sAdRNgAPqmH2VOmZFazxvCIuq7cQt6wQb3emmeCSm4xBgcIcR02S4lPCfjWg5eoE';
const DISTANCE_MATRIX_BASE_URL = 'https://api.distancematrix.ai/maps/api/distancematrix/json';
const STOP_PROXIMITY_THRESHOLD = 0.05; // ~5.5km in degrees (rough approximation)
const STOP_PROXIMITY_METERS = 500; // 500 meters - consider bus at stop if within this distance

// Store current bus location and ETA data
let currentBusLocation = null;
let currentStopIndex = -1; // -1 means not determined yet
let stopETAs = {}; // Store ETA in seconds for each stop index
let isCalculatingETA = false; // Prevent multiple simultaneous ETA calculations

// Initialize map
function initMap() {
    if (route.length === 0) { 
        document.getElementById('eta-list').innerHTML = '<div style="text-align:center;color:#666;">No route data</div>';
        return; 
    }

    const start = [parseFloat(route[0].lat), parseFloat(route[0].lng)];
    
    // Small zoom level
    map = L.map('map').setView(start, 10);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '© OpenStreetMap'
    }).addTo(map);

    // Route line
    const latLngs = route.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
    L.polyline(latLngs, {color: '#e74c3c', weight: 4}).addTo(map);

    // Bus marker
    const busIcon = L.divIcon({
        html: '🚌', className: 'bus-icon', 
        iconSize: [36, 36], iconAnchor: [18, 18]
    });
    busMarker = L.marker(start, { icon: busIcon }).addTo(map);

    // Add stop markers WITH ETA POPUPS
    route.forEach((stop, i) => {
        const stopIcon = L.divIcon({
            html: `<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold; font-size: 14px;">${stop.sequence}</span>`, className: 'stop-icon', 
            iconSize: [28, 28], iconAnchor: [14, 14]
        });
        const marker = L.marker([parseFloat(stop.lat), parseFloat(stop.lng)], {icon: stopIcon}).addTo(map);
        
        // ETA popup for each stop
        const remaining = i * (DURATION_PER_SEGMENT / 1000 / 60);
        marker.bindPopup(`
            <b>${stop.stop_name}</b><br>
            ETA: ${Math.ceil(remaining)} min<br>
            Stop ${stop.sequence}/${route.length}
        `);
    });

    // Initialize ETA list IMMEDIATELY
    updateETAList();
    updateStatus('✅ Ready - Fetching live location...');
    
    // Start fetching live bus location
    startLiveLocationTracking();
}

// Proper ETA calculation with real-time Distance Matrix API data
function updateETAList() {
    const etaList = document.getElementById('eta-list');
    if (!etaList) return;
    
    etaList.innerHTML = '';
    
    const now = Date.now();
    
    route.forEach((stop, i) => {
        let etaDisplay = '';
        let etaTime = '';
        let progressText = '';
        
        // Determine if this is the current stop based on live location
        const isCurrentStop = (currentStopIndex >= 0 && i === currentStopIndex);
        const isNextStop = (currentStopIndex >= 0 && i === currentStopIndex + 1);
        const hasETA = stopETAs[i] !== undefined;
        
        if (i < currentStopIndex || (currentStopIndex < 0 && i < index)) {
            // Past stops
            etaDisplay = '✅ Arrived';
            progressText = '✅ Done';
        } else if (isCurrentStop) {
            // Current stop
            etaDisplay = '📍 At Stop';
            progressText = '📍 Now';
        } else if (hasETA && currentBusLocation) {
            // Any future stop with real ETA from Distance Matrix API
            const etaSeconds = stopETAs[i];
            const etaMs = etaSeconds * 1000;
            const arrivalTime = new Date(now + etaMs);
            etaTime = arrivalTime.toLocaleTimeString([], 
                {hour: '2-digit', minute: '2-digit', second: '2-digit'});
            const etaMinutes = Math.ceil(etaSeconds / 60);
            etaDisplay = `ETA: ${etaTime} (${etaMinutes} min)`;
            progressText = `⏳ ${etaMinutes} minutes away`;
        } else if (isNextStop && currentBusLocation) {
            // Next stop but ETA not yet calculated
            etaDisplay = 'Calculating...';
            progressText = '⏳ Calculating ETA...';
        } else {
            // Future stops without ETA - use estimated time
            const remainingSegments = Math.max(0, i - (currentStopIndex >= 0 ? currentStopIndex : index));
            const etaMs = remainingSegments * DURATION_PER_SEGMENT;
            etaTime = new Date(now + etaMs).toLocaleTimeString([], 
                {hour: '2-digit', minute: '2-digit', second: '2-digit'});
            const etaMinutes = Math.ceil(etaMs / 60000) || 0;
            etaDisplay = `ETA: ${etaTime} (est.)`;
            progressText = `⏳ ${etaTime}`;
        }
        
        const item = document.createElement('div');
        item.className = `eta-item ${isCurrentStop ? 'current' : isNextStop ? 'next' : ''}`;
        item.innerHTML = `
            <div class="stop-info">
                <div class="stop-number">${stop.sequence}</div>
                <div class="stop-name">${stop.stop_name}</div>
            </div>
            <div class="eta-time">${etaDisplay}</div>
            <div class="eta-progress">${progressText}</div>
        `;
        etaList.appendChild(item);
    });
}

function animateBus() {
    if (!isPlaying || index >= route.length - 1) {
        if (index >= route.length - 1) {
            index = 0; step = 0;
            updateStatus('Route complete!');
            updateETAList();
        }
        return;
    }

    const startPoint = route[index];
    const endPoint = route[index + 1];
    
    // Calculate segment duration based on ETA for the next stop
    const nextStopIndex = index + 1;
    let segmentDuration = DURATION_PER_SEGMENT; // Default fallback
    
    if (stopETAs[nextStopIndex] !== undefined) {
        // ETA is in seconds, convert to milliseconds
        // This ETA is from current location to next stop, which is what we want for animation
        segmentDuration = stopETAs[nextStopIndex] * 1000;
        // Ensure minimum duration to avoid too fast animation
        segmentDuration = Math.max(segmentDuration, 1000); // At least 1 second
    } else {
        // If no ETA available, calculate distance-based estimate
        const startLat = parseFloat(startPoint.lat);
        const startLng = parseFloat(startPoint.lng);
        const endLat = parseFloat(endPoint.lat);
        const endLng = parseFloat(endPoint.lng);
        const distance = calculateDistance(startLat, startLng, endLat, endLng);
        // Estimate: assume average speed of 40 km/h (11.11 m/s) for urban routes
        const estimatedSeconds = distance / 11.11;
        segmentDuration = estimatedSeconds * 1000;
        segmentDuration = Math.max(segmentDuration, 1000); // At least 1 second
        // Also set a reasonable maximum to avoid very long animations
        segmentDuration = Math.min(segmentDuration, 60000); // Max 60 seconds per segment
    }
    
    // Update current segment duration (only at start of segment)
    if (step === 0) {
        currentSegmentDuration = segmentDuration;
    }
    
    // Calculate delay based on current segment duration
    const delay = currentSegmentDuration / STEPS_PER_SEGMENT;
    
    step++;
    const fraction = Math.min(step / STEPS_PER_SEGMENT, 1);
    
    const lat = parseFloat(startPoint.lat) + (parseFloat(endPoint.lat) - parseFloat(startPoint.lat)) * fraction;
    const lng = parseFloat(startPoint.lng) + (parseFloat(endPoint.lng) - parseFloat(startPoint.lng)) * fraction;

    busMarker.setLatLng([lat, lng]);
    map.panTo([lat, lng]);

    if (fraction >= 1) {
        step = 0;
        index++;
        updateETAList(); // Update ETA after each segment
        if (index < route.length) {
            updateStatus(`Stop ${route[index].sequence}/${route.length}`);
        }
        if (isPlaying) {
            // Brief pause at stop before continuing
            animationTimeout = setTimeout(animateBus, 800);
        }
    } else {
        animationTimeout = setTimeout(animateBus, delay);
    }
}

function togglePlay() {
    if (isPlaying) return;
    
    // If we have a live location, start animation from that position
    if (currentBusLocation && currentBusLocation.lat && currentBusLocation.lng) {
        const animPos = calculateAnimationPositionFromLiveLocation(
            currentBusLocation.lat, 
            currentBusLocation.lng
        );
        
        if (animPos) {
            index = animPos.index;
            step = animPos.step;
            // Update bus marker to match calculated position
            const startPoint = route[index];
            const endPoint = route[index + 1];
            const fraction = Math.min(step / STEPS_PER_SEGMENT, 1);
            const lat = parseFloat(startPoint.lat) + (parseFloat(endPoint.lat) - parseFloat(startPoint.lat)) * fraction;
            const lng = parseFloat(startPoint.lng) + (parseFloat(endPoint.lng) - parseFloat(startPoint.lng)) * fraction;
            busMarker.setLatLng([lat, lng]);
        } else if (currentStopIndex >= 0) {
            // Fallback: use current stop index
            index = currentStopIndex;
            step = 0;
        }
    }
    
    isPlaying = true;
    document.getElementById('play').style.display = 'none';
    document.getElementById('pause').style.display = 'inline-block';
    updateStatus('Bus moving...');
    updateETAList();
    animateBus();
}

function togglePause() {
    isPlaying = false;
    if (animationTimeout) clearTimeout(animationTimeout);
    document.getElementById('play').style.display = 'inline-block';
    document.getElementById('pause').style.display = 'none';
    updateStatus('Paused - Live tracking continues');
}

function resetBus() {
    togglePause();
    index = 0; 
    step = 0;
    // Don't reset to route start - keep live location
    // Just reset animation state
    updateETAList();
    updateStatus('Reset - Live tracking continues');
}

function updateStatus(msg) {
    document.getElementById('status').textContent = msg;
}

// Calculate distance between two coordinates using Haversine formula (in meters)
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Determine which stop the bus is currently at or nearest to
function determineCurrentStop(busLat, busLng) {
    let nearestStopIndex = -1;
    let minDistance = Infinity;
    
    route.forEach((stop, index) => {
        const stopLat = parseFloat(stop.lat);
        const stopLng = parseFloat(stop.lng);
        const distance = calculateDistance(busLat, busLng, stopLat, stopLng);
        
        if (distance < minDistance) {
            minDistance = distance;
            nearestStopIndex = index;
        }
    });
    
    // Check if bus is at a stop (within threshold)
    const nearestStop = route[nearestStopIndex];
    const nearestStopLat = parseFloat(nearestStop.lat);
    const nearestStopLng = parseFloat(nearestStop.lng);
    const distanceToNearest = calculateDistance(busLat, busLng, nearestStopLat, nearestStopLng);
    
    // If bus is within threshold, consider it at that stop
    if (distanceToNearest <= STOP_PROXIMITY_METERS) {
        return nearestStopIndex;
    }
    
    return nearestStopIndex; // Return nearest stop even if not exactly at it
}

// Calculate animation position (index and step) based on current live location
function calculateAnimationPositionFromLiveLocation(busLat, busLng) {
    if (!busLat || !busLng) return null;
    
    // First check if bus is at or very close to a stop
    if (currentStopIndex >= 0) {
        const stop = route[currentStopIndex];
        const stopLat = parseFloat(stop.lat);
        const stopLng = parseFloat(stop.lng);
        const distanceToStop = calculateDistance(busLat, busLng, stopLat, stopLng);
        
        // If very close to a stop (within 200m), start from that stop
        if (distanceToStop <= 200) {
            return {
                index: currentStopIndex,
                step: 0
            };
        }
    }
    
    let bestSegmentIndex = -1;
    let bestFraction = 0;
    let minDistance = Infinity;
    
    // Check each segment to find which one the bus is closest to
    for (let i = 0; i < route.length - 1; i++) {
        const startPoint = route[i];
        const endPoint = route[i + 1];
        const startLat = parseFloat(startPoint.lat);
        const startLng = parseFloat(startPoint.lng);
        const endLat = parseFloat(endPoint.lat);
        const endLng = parseFloat(endPoint.lng);
        
        // Calculate the fraction along this segment that the bus is at
        // Using projection of point onto line segment
        const dx = endLng - startLng;
        const dy = endLat - startLat;
        const segmentLengthSq = dx * dx + dy * dy;
        
        if (segmentLengthSq === 0) continue;
        
        const t = Math.max(0, Math.min(1, 
            ((busLng - startLng) * dx + (busLat - startLat) * dy) / segmentLengthSq
        ));
        
        // Calculate the point on the segment at fraction t
        const projLat = startLat + t * dy;
        const projLng = startLng + t * dx;
        
        // Calculate distance from bus to this point on the segment
        const distance = calculateDistance(busLat, busLng, projLat, projLng);
        
        if (distance < minDistance) {
            minDistance = distance;
            bestSegmentIndex = i;
            bestFraction = t;
        }
    }
    
    if (bestSegmentIndex >= 0) {
        // Convert fraction to step, ensuring we don't go beyond the segment
        const calculatedStep = Math.min(Math.floor(bestFraction * STEPS_PER_SEGMENT), STEPS_PER_SEGMENT - 1);
        return {
            index: bestSegmentIndex,
            step: calculatedStep
        };
    }
    
    return null;
}

// Fetch ETA from current bus location to a specific stop using Distance Matrix API
async function fetchETAFromCurrentLocation(busLat, busLng, targetStopIndex) {
    if (targetStopIndex >= route.length || targetStopIndex < 0) {
        return null;
    }
    
    // Use a per-stop calculation flag to allow multiple ETAs to be calculated
    const calculationKey = `calculating_${targetStopIndex}`;
    if (window[calculationKey]) {
        return null; // Already calculating for this stop
    }
    
    window[calculationKey] = true;
    
    try {
        const targetStop = route[targetStopIndex];
        const destLat = parseFloat(targetStop.lat);
        const destLng = parseFloat(targetStop.lng);
        
        const url = `${DISTANCE_MATRIX_BASE_URL}?origins=${busLat},${busLng}&destinations=${destLat},${destLng}&key=${DISTANCE_MATRIX_API_KEY}`;
        
        console.log(`Fetching ETA from (${busLat}, ${busLng}) to stop ${targetStopIndex + 1} (${targetStop.stop_name})`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Distance Matrix API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'OK' && result.rows && result.rows[0] && result.rows[0].elements[0]) {
            const element = result.rows[0].elements[0];
            
            if (element.status === 'OK' && element.duration) {
                const durationSeconds = element.duration.value;
                stopETAs[targetStopIndex] = durationSeconds;
                
                // If animation is playing and this ETA is for the current segment, update segment duration
                if (isPlaying && targetStopIndex === index + 1 && step === 0) {
                    // We're at the start of the segment, update duration
                    currentSegmentDuration = durationSeconds * 1000;
                    currentSegmentDuration = Math.max(currentSegmentDuration, 1000);
                    console.log(`🔄 Updated animation speed for current segment: ${Math.round(durationSeconds)} seconds`);
                }
                
                // Update ETA list with new data
                updateETAList();
                
                console.log(`✅ ETA to stop ${targetStopIndex + 1} (${targetStop.sequence}): ${durationSeconds} seconds (${Math.round(durationSeconds / 60)} minutes)`);
                return durationSeconds;
            } else {
                console.warn(`⚠️ Distance Matrix API returned status: ${element.status} for stop ${targetStopIndex + 1}`);
                throw new Error(`Distance Matrix API returned status: ${element.status}`);
            }
        } else {
            console.warn(`⚠️ Invalid Distance Matrix API response format for stop ${targetStopIndex + 1}`);
            throw new Error('Invalid Distance Matrix API response format');
        }
    } catch (error) {
        console.error(`❌ Error fetching ETA for stop ${targetStopIndex + 1}:`, error);
        return null;
    } finally {
        window[calculationKey] = false;
    }
}

// Fetch live bus location from API
async function fetchLiveLocation() {
    try {
        const response = await fetch(`${API_BASE_URL}/${VEHICLE_ID}/status?withAddress=true`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.message === 'Success' && result.data) {
            const lat = parseFloat(result.data.latitude);
            const lng = parseFloat(result.data.longitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
                // Store current bus location
                currentBusLocation = { lat, lng };
                
                // Update bus marker position
                busMarker.setLatLng([lat, lng]);
                map.panTo([lat, lng], { animate: true, duration: 0.5 });
                
                // Determine current stop
                const detectedStopIndex = determineCurrentStop(lat, lng);
                const nearestStop = route[detectedStopIndex];
                const nearestStopLat = parseFloat(nearestStop.lat);
                const nearestStopLng = parseFloat(nearestStop.lng);
                const distanceToNearest = calculateDistance(lat, lng, nearestStopLat, nearestStopLng);
                const isAtStop = distanceToNearest <= STOP_PROXIMITY_METERS;
                
                // Check if we've reached a new stop
                const stopChanged = detectedStopIndex !== currentStopIndex;
                if (stopChanged) {
                    currentStopIndex = detectedStopIndex;
                    // Clear ETAs for stops we've passed
                    for (let i = 0; i <= currentStopIndex; i++) {
                        delete stopETAs[i];
                    }
                }
                
                // Calculate ETAs for future stops from current location
                // Calculate for next 3 stops to provide good ETA coverage
                const maxStopsToCalculate = Math.min(3, route.length - detectedStopIndex - 1);
                
                for (let i = 0; i < maxStopsToCalculate; i++) {
                    const targetStopIndex = detectedStopIndex + 1 + i;
                    if (targetStopIndex < route.length) {
                        // For the next stop, always try to get fresh ETA
                        // For other stops, only if we don't have one
                        const shouldFetch = (i === 0 && (!stopETAs[targetStopIndex] || stopChanged)) || 
                                          (i > 0 && !stopETAs[targetStopIndex]);
                        
                        if (shouldFetch) {
                            // Fetch ETA in background (don't await to avoid blocking)
                            fetchETAFromCurrentLocation(lat, lng, targetStopIndex).catch(err => {
                                console.error(`Error fetching ETA for stop ${targetStopIndex + 1}:`, err);
                            });
                            
                            // Add small delay between API calls to avoid rate limiting
                            if (i < maxStopsToCalculate - 1) {
                                await new Promise(resolve => setTimeout(resolve, 300));
                            }
                        }
                    }
                }
                
                // Update ETA list immediately with current data
                updateETAList();
                
                // Update status with last packet time
                const lastPacket = result.data.lastPacket ? new Date(result.data.lastPacket).toLocaleTimeString() : 'N/A';
                const stopInfo = currentStopIndex >= 0 ? ` - Near Stop ${route[currentStopIndex].sequence}` : '';
                updateStatus(`📍 Live Location - Last Update: ${lastPacket}${stopInfo}`);
                
                return { lat, lng, data: result.data };
            } else {
                throw new Error('Invalid coordinates received');
            }
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Error fetching live location:', error);
        updateStatus(`⚠️ Error: ${error.message}`);
        return null;
    }
}

// Start fetching live location every 5 seconds
function startLiveLocationTracking() {
    // Fetch immediately
    fetchLiveLocation();
    
    // Then fetch every 5 seconds
    if (liveLocationInterval) {
        clearInterval(liveLocationInterval);
    }
    liveLocationInterval = setInterval(fetchLiveLocation, FETCH_INTERVAL);
}

// Stop live location tracking
function stopLiveLocationTracking() {
    if (liveLocationInterval) {
        clearInterval(liveLocationInterval);
        liveLocationInterval = null;
    }
}

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}
