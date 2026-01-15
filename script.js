// Route data - embedded directly in JavaScript
const route1 = [
    {lat: -6.26155, lng: 106.81327, sequence: 1, stop_name: 'Kemang', estimated_time: '11:00:00'},
    {lat: -6.24357, lng: 106.86189, sequence: 2, stop_name: 'Carefour', estimated_time: '11:02:00'},
    {lat: -6.1162, lng: 106.15478, sequence: 3, stop_name: 'Ciceri', estimated_time: '11:05:00'},
    {lat: -6.12289, lng: 106.1585, sequence: 4, stop_name: 'Kebon Jahe', estimated_time: '11:07:00'}, // done
    {lat: -6.12588, lng: 106.14047, sequence: 5, stop_name: 'Ciracas', estimated_time: '11:09:00'},
    {lat: -6.01872, lng: 106.0558, sequence: 6, stop_name: 'Citraland', estimated_time: '11:11:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 7, stop_name: 'Kepandean', estimated_time: '11:13:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 8, stop_name: 'Akses Tol Serang Barat', estimated_time: '11:13:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 9, stop_name: 'Exit Tol Merak', estimated_time: '11:13:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 10, stop_name: 'FAM', estimated_time: '11:13:00'}
];

const route2 = [
    {lat: -6.19871, lng: 106.74193, sequence: 1, stop_name: 'Sari Asih Belakang', estimated_time: '11:00:00'},
    {lat: -6.23253, lng: 106.54487, sequence: 2, stop_name: 'Kaligandu', estimated_time: '11:02:00'},
    {lat: -6.18556, lng: 106.45467, sequence: 3, stop_name: 'Bumi Agung', estimated_time: '11:05:00'},
    {lat: -6.13811, lng: 106.29415, sequence: 4, stop_name: 'Kelapa Dua', estimated_time: '11:07:00'},
    {lat: -6.12588, lng: 106.14047, sequence: 5, stop_name: 'Kepandean', estimated_time: '11:09:00'},
    {lat: -6.01872, lng: 106.0558, sequence: 6, stop_name: 'Akses Tol Serang Barat', estimated_time: '11:11:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 7, stop_name: 'Exit Tol Merak', estimated_time: '11:13:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 8, stop_name: 'FAM', estimated_time: '11:13:00'}
];

const route3 = [
    {lat: -6.19871, lng: 106.74193, sequence: 1, stop_name: 'PCI', estimated_time: '11:00:00'},
    {lat: -6.23253, lng: 106.54487, sequence: 2, stop_name: 'Perumnas', estimated_time: '11:02:00'},
    {lat: -6.18556, lng: 106.45467, sequence: 3, stop_name: 'Palas', estimated_time: '11:05:00'},
    {lat: -6.13811, lng: 106.29415, sequence: 4, stop_name: 'Pagebangan', estimated_time: '11:07:00'},
    {lat: -6.12588, lng: 106.14047, sequence: 5, stop_name: 'Mesjid Agung', estimated_time: '11:09:00'},
    {lat: -6.01872, lng: 106.0558, sequence: 6, stop_name: 'Simpang', estimated_time: '11:11:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 7, stop_name: 'Damkar', estimated_time: '11:13:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 8, stop_name: 'FAM', estimated_time: '11:13:00'}
];

const route4 = [
    {lat: -6.19871, lng: 106.74193, sequence: 1, stop_name: 'FAM', estimated_time: '11:00:00'},
    {lat: -6.23253, lng: 106.54487, sequence: 2, stop_name: 'Damkar', estimated_time: '11:02:00'},
    {lat: -6.18556, lng: 106.45467, sequence: 3, stop_name: 'Krakatau Junction', estimated_time: '11:05:00'},
    {lat: -6.13811, lng: 106.29415, sequence: 4, stop_name: 'Transmart', estimated_time: '11:07:00'},
    {lat: -6.12588, lng: 106.14047, sequence: 5, stop_name: 'Simpang', estimated_time: '11:09:00'},
    {lat: -6.01872, lng: 106.0558, sequence: 6, stop_name: 'Krenceng lewat depan (Jalan Raya Utama Anyer)', estimated_time: '11:11:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 7, stop_name: 'Warnasari', estimated_time: '11:13:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 8, stop_name: 'Oktip', estimated_time: '11:13:00'},
    {lat: -6.03439, lng: 105.93831, sequence: 9, stop_name: 'Ex Sari Manis', estimated_time: '11:13:00'}
];

// Global variables
let map, busMarker, animationTimeout, liveLocationInterval;
let isPlaying = false, index = -1, step = 0; // Animation disabled - position based on live location only
const STEPS_PER_SEGMENT = 60;
const DURATION_PER_SEGMENT = 2500; // Fallback duration in ms (not used - no animation)
const DELAY = DURATION_PER_SEGMENT / STEPS_PER_SEGMENT;
let currentSegmentDuration = DURATION_PER_SEGMENT; // Not used - no animation
let hasReceivedFirstLocation = false; // Track if we've received the first live location

// Check if route should be reversed (5 PM to 5 AM Indonesian time - WIB UTC+7)
function shouldReverseRoute() {
    const now = new Date();
    // Get UTC hours and add 7 for Indonesian time (WIB = UTC+7)
    const utcHours = now.getUTCHours();
    const indonesianHours = (utcHours + 7) % 24; // Add 7 hours and wrap around if needed
    // Reverse route from 5 PM (17:00) to 5 AM (05:00)
    // Normal route from 5 AM (05:00) to 5 PM (17:00)
    return indonesianHours >= 17 || indonesianHours < 5;
}

// Get route with time-based reversal
// Normal route: 5 AM to 5 PM (05:00 - 17:00)
// Reversed route: 5 PM to 5 AM (17:00 - 05:00)
function getRouteWithTimeReversal(originalRoute) {
    if (!originalRoute || originalRoute.length === 0) {
        return originalRoute;
    }
    
    // If between 5 PM and 5 AM, reverse the route
    if (shouldReverseRoute()) {
        // Create a deep copy of the route array with new objects
        const reversedRoute = originalRoute.slice().reverse().map((stop, index) => {
            return {
                lat: stop.lat,
                lng: stop.lng,
                sequence: index + 1,
                stop_name: stop.stop_name,
                estimated_time: stop.estimated_time
            };
        });
        return reversedRoute;
    }
    
    // Before 5 PM, return a copy of the original route (to avoid modifying originals)
    return originalRoute.map(stop => ({
        lat: stop.lat,
        lng: stop.lng,
        sequence: stop.sequence,
        stop_name: stop.stop_name,
        estimated_time: stop.estimated_time
    }));
}

// Bus data - list of available buses
const buses = [
    { id: 83089, name: 'A 7702 S - D01', route: route1 },
    { id: 88440, name: 'A 7696 S - D02', route: route2 },
    { id: 92066, name: 'B 7012 XXA - D05', route: route3 },
    { id: 69153, name: 'B 1948 PDJ - D06', route: route4 },
];

// API Configuration
const API_BASE_URL = 'https://vsms-v2-public.mceasy.com/v1/vehicles';
let VEHICLE_ID = 83089; // Default bus, will be updated when bus is selected
// Global route variable - set to default bus's route with time-based reversal
let route = getRouteWithTimeReversal(route1); // Default to route1 for bus 83089
const API_TOKEN = 'b5fU8a2Dc2y7zbacF4fccrFDTKeG27f3h5faua8dkDealKmYSRb5I0go3a2XUu0taiabbhuqba6ajLFTac48aSgcbf4bgJHej4fea6MQG6qUzr67gO4IL6L385syZJOW6kXbf75mFaLGuPxfmSV86A1aZg0p4RkayHOt2fC3TRPA6AV6zxaV7Ffz6F4DYKi4kv6Id7tS7FZa4SjKeRH9fktkhVBTV6yWOanlbc4kLafFecbbc9x6yOae60eGp8l8';
const FETCH_INTERVAL = 5000; // 5 seconds

const STOP_PROXIMITY_THRESHOLD = 0.05; // ~5.5km in degrees (rough approximation)
const STOP_PROXIMITY_METERS = 500; // 500 meters - consider bus at stop if within this distance
const DEFAULT_BUS_SPEED_KMPH = 40; // Default bus speed in km/h if not available from API
const STOP_GEOFENCE_RADIUS_METERS = 100; // Geofence radius for stops in meters

// Store current bus location and ETA data
let currentBusLocation = null;
let currentStopIndex = -1; // -1 means not determined yet
let isBusAtStop = false; // Track if bus is currently at a stop
let stopETAs = {}; // Store ETA in seconds for each stop index
let stopArrivalTimes = {}; // Store arrival time for each stop index
let isCalculatingETA = false; // Prevent multiple simultaneous ETA calculations

// Store vehicle details (odometer, driver name, engineOn, and speed)
let vehicleDetails = {
    // odometer: null, // Commented out - replaced with current date
    driverName: null,
    engineOn: null,
    speed: null
};

// View toggle variables
let currentView = 'map'; // 'map' or 'line'

// Toggle between map and digital view (now just toggles map visibility)
function toggleView() {
    const mapView = document.getElementById('map');
    const container = document.querySelector('.container');
    const toggleCheckbox = document.getElementById('viewToggle');
    
    // Toggle is checked = Digital View, unchecked = Map View
    if (toggleCheckbox.checked) {
        // Show digital view - hide map view
        mapView.style.display = 'none';
        if (container) container.classList.remove('map-view-active');
        currentView = 'line';
    } else {
        // Show map view - hide digital view in ETA panel
        mapView.style.display = 'block';
        if (container) container.classList.add('map-view-active');
        currentView = 'map';
    }
    
    // Update bus position after view change (only if digital view is active)
    if (currentView === 'line') {
        updateIntegratedLineBusPosition();
    }
}

// Update bus position in integrated digital view based on current animation state
function updateIntegratedLineBusPosition() {
    // Only update if digital view is active
    if (currentView !== 'line') return;
    
    const busIcon = document.querySelector('.bus-icon-integrated');
    const routeLineCovered = document.querySelector('.route-line-covered-integrated');
    const routeLineTrack = document.querySelector('.route-line-track');
    const routeLineIntegrated = document.querySelector('.route-line-integrated');
    const etaList = document.getElementById('eta-list');
    
    if (!busIcon || !routeLineCovered || !routeLineTrack || !routeLineIntegrated || !etaList) return;
    
    const etaItems = etaList.querySelectorAll('.eta-item');
    if (etaItems.length === 0) return;
    
    // Ensure we have the same number of stops as route items
    if (etaItems.length !== route.length) {
        // Mismatch detected but continue anyway
    }
    
    // Calculate positions of each stop (center of each item)
    const stopPositions = [];
    let currentTop = 0;
    
    etaItems.forEach((item, i) => {
        const height = item.offsetHeight;
        const centerY = currentTop + height / 2;
        stopPositions.push(centerY);
        currentTop += height;
        if (i < etaItems.length - 1) {
            // Get margin-bottom from computed style or use default
            const marginBottom = parseInt(window.getComputedStyle(item).marginBottom) || 8;
            currentTop += marginBottom;
        }
    });
    
    // First stop position (start of line) - center of first marker
    const firstStopY = stopPositions[0];
    // Last stop position (end of line) - center of last marker
    const lastStopY = stopPositions[stopPositions.length - 1];
    // Line height - exactly from first stop center to last stop center (no extension beyond)
    const lineHeight = Math.max(0, lastStopY - firstStopY);
    
    // Update route line position and height - stop exactly at last stop center
    routeLineIntegrated.style.top = firstStopY + 'px';
    routeLineIntegrated.style.bottom = 'auto';
    routeLineIntegrated.style.height = lineHeight + 'px';
    routeLineIntegrated.style.maxHeight = lineHeight + 'px';
    routeLineIntegrated.style.overflow = 'hidden'; // Prevent any overflow
    routeLineIntegrated.style.boxSizing = 'border-box'; // Ensure padding doesn't add to height
    
    routeLineTrack.style.top = '0';
    routeLineTrack.style.bottom = 'auto';
    routeLineTrack.style.height = lineHeight + 'px';
    routeLineTrack.style.maxHeight = lineHeight + 'px';
    routeLineTrack.style.overflow = 'hidden';
    
    // Calculate current bus position relative to the line
    // Position is based ONLY on live location - no animation
    let busPositionOnLine = 0;
    
    // FIRST PRIORITY: Use live location to calculate exact position on route
    if (currentBusLocation && currentBusLocation.lat && currentBusLocation.lng) {
        const animPos = calculateAnimationPositionFromLiveLocation(
            currentBusLocation.lat,
            currentBusLocation.lng
        );
        
        if (animPos && animPos.index >= 0 && animPos.index < stopPositions.length) {
            // Calculate position based on live location
            const segmentProgress = Math.min(animPos.step / STEPS_PER_SEGMENT, 1);
            const currentStopY = stopPositions[animPos.index];
            
            if (animPos.index < stopPositions.length - 1) {
                const nextStopY = stopPositions[animPos.index + 1];
                busPositionOnLine = currentStopY + (nextStopY - currentStopY) * segmentProgress;
            } else {
                // At last stop
                busPositionOnLine = currentStopY;
            }
        } else if (currentStopIndex >= 0 && currentStopIndex < stopPositions.length) {
            // Fallback: use currentStopIndex if we can't calculate from live location
            busPositionOnLine = stopPositions[currentStopIndex];
        }
    }
    // SECOND PRIORITY: Use currentStopIndex if available
    else if (currentStopIndex >= 0 && currentStopIndex < stopPositions.length && currentStopIndex < route.length) {
        busPositionOnLine = stopPositions[currentStopIndex];
    }
    // THIRD PRIORITY: Use index/step (from last known position)
    else if (index >= 0 && index < route.length && index < stopPositions.length) {
        if (index < route.length - 1) {
            const segmentProgress = Math.min(step / STEPS_PER_SEGMENT, 1);
            const currentStopY = stopPositions[index];
            const nextStopY = stopPositions[index + 1];
            busPositionOnLine = currentStopY + (nextStopY - currentStopY) * segmentProgress;
        } else {
            busPositionOnLine = stopPositions[route.length - 1];
        }
    }
    // LAST RESORT: Default to first stop
    else {
        busPositionOnLine = stopPositions[0] || 0;
    }
    
    // Convert bus position to position relative to line start
    // busPositionOnLine is relative to eta-list top
    // route-line-integrated starts at firstStopY (relative to eta-list)
    // So bus position relative to route-line-integrated is: busPositionOnLine - firstStopY
    const busPositionFromLineStart = busPositionOnLine - firstStopY;
    
    // Calculate transition duration based on ETA (same as map view animation)
    // Use currentSegmentDuration if available (set by animateBus), otherwise calculate it
    let transitionDuration = 0.1; // Default fallback in seconds
    
    if (index < route.length - 1 && isPlaying) {
        let segmentDuration = currentSegmentDuration; // Use the same duration as map view animation
        
        // If currentSegmentDuration is not set or is the default, calculate it
        if (!segmentDuration || segmentDuration === DURATION_PER_SEGMENT) {
            const nextStopIndex = index + 1;
            segmentDuration = DURATION_PER_SEGMENT; // Default fallback
            
            if (stopETAs[nextStopIndex] !== undefined) {
                // ETA is in seconds, convert to milliseconds
                segmentDuration = stopETAs[nextStopIndex] * 1000;
                segmentDuration = Math.max(segmentDuration, 1000); // At least 1 second
            } else {
                // If no ETA available, calculate distance-based estimate
                const startPoint = route[index];
                const endPoint = route[index + 1];
                const startLat = parseFloat(startPoint.lat);
                const startLng = parseFloat(startPoint.lng);
                const endLat = parseFloat(endPoint.lat);
                const endLng = parseFloat(endPoint.lng);
                const distance = calculateDistance(startLat, startLng, endLat, endLng);
                // Estimate: assume average speed of 40 km/h (11.11 m/s) for urban routes
                const estimatedSeconds = distance / 11.11;
                segmentDuration = estimatedSeconds * 1000;
                segmentDuration = Math.max(segmentDuration, 1000); // At least 1 second
                segmentDuration = Math.min(segmentDuration, 60000); // Max 60 seconds per segment
            }
        }
        
        // Calculate delay per step (same as animateBus function)
        const delay = segmentDuration / STEPS_PER_SEGMENT;
        // Convert to seconds for CSS transition
        transitionDuration = delay / 1000;
    }
    
    // Update bus icon position - NO animation, instant update based on live location
    busIcon.style.transition = 'none';
    busIcon.style.top = busPositionOnLine + 'px';
    busIcon.style.bottom = 'auto';
    busIcon.style.transform = 'translateX(-50%) translateY(-50%)';
    
    // Update covered line height - NO animation, instant update based on live location
    // Ensure covered line doesn't extend beyond the last stop
    const maxCoveredHeight = lineHeight; // Can't exceed total line height
    const coveredHeight = Math.min(Math.max(0, busPositionFromLineStart), maxCoveredHeight);
    routeLineCovered.style.transition = 'none';
    routeLineCovered.style.top = '0';
    routeLineCovered.style.bottom = 'auto';
    routeLineCovered.style.height = coveredHeight + 'px';
    routeLineCovered.style.maxHeight = maxCoveredHeight + 'px';
    routeLineCovered.style.overflow = 'hidden'; // Prevent overflow
}

// Toggle bus dropdown
function toggleBusDropdown() {
    const dropdown = document.getElementById('busDropdown');
    const options = document.getElementById('busSelectOptions');
    const selected = document.getElementById('busSelectDisplay');
    
    if (!dropdown || !options || !selected) return;
    
    const isOpen = options.classList.contains('show');
    
    if (isOpen) {
        options.classList.remove('show');
        selected.classList.remove('active');
    } else {
        // Close other dropdowns if any
        document.querySelectorAll('.dropdown-options.show').forEach(opt => {
            opt.classList.remove('show');
        });
        document.querySelectorAll('.dropdown-selected.active').forEach(sel => {
            sel.classList.remove('active');
        });
        
        options.classList.add('show');
        selected.classList.add('active');
    }
}

// Populate bus dropdown
function populateBusDropdown() {
    const optionsContainer = document.getElementById('busSelectOptions');
    const displayText = document.getElementById('busSelectText');
    if (!optionsContainer || !displayText) return;
    
    // Clear existing options
    optionsContainer.innerHTML = '';
    
    // Add buses to dropdown
    buses.forEach(bus => {
        const option = document.createElement('div');
        option.className = 'dropdown-option';
        if (bus.id === VEHICLE_ID) {
            option.classList.add('selected');
        }
        option.textContent = bus.name;
        option.dataset.busId = bus.id;
        option.onclick = () => selectBus(bus.id);
        optionsContainer.appendChild(option);
    });
    
    // Set default display text
    const selectedBus = buses.find(bus => bus.id === VEHICLE_ID);
    if (selectedBus) {
        displayText.textContent = selectedBus.name;
    }
}

// Handle bus selection
function selectBus(busId) {
    const selectedBusId = parseInt(busId);
    if (selectedBusId === VEHICLE_ID) {
        // Just close dropdown if same bus selected
        toggleBusDropdown();
        return;
    }
    
    // Update vehicle ID
    VEHICLE_ID = selectedBusId;
    
    // Update display text
    const displayText = document.getElementById('busSelectText');
    const selectedBus = buses.find(bus => bus.id === VEHICLE_ID);
    if (displayText && selectedBus) {
        displayText.textContent = selectedBus.name;
    }
    
    // Update global route variable to selected bus's route with time-based reversal
    if (selectedBus && selectedBus.route) {
        route = getRouteWithTimeReversal(selectedBus.route);
        // Update route direction tracking
        lastRouteDirection = shouldReverseRoute();
    }
    
    // Update selected option styling
    const options = document.querySelectorAll('.dropdown-option');
    options.forEach(opt => {
        if (parseInt(opt.dataset.busId) === VEHICLE_ID) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
    
    // Close dropdown
    toggleBusDropdown();
    
    // Reset state
    currentBusLocation = null;
    currentStopIndex = -1;
    isBusAtStop = false;
    stopETAs = {};
    stopArrivalTimes = {};
    index = -1;
    step = 0;
    hasReceivedFirstLocation = false;
    vehicleDetails.engineOn = null;
    vehicleDetails.speed = null;
    
    // Stop current tracking
    stopLiveLocationTracking();
    
    // Reinitialize map with new route
    if (map && route.length > 0) {
        // Clear existing map layers (markers and polylines)
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });
        
        // Add new route line
        const latLngs = route.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
        L.polyline(latLngs, {color: '#e74c3c', weight: 4}).addTo(map);
        
        // Add new stop markers with ETA popups
        route.forEach((stop, i) => {
            const stopIcon = L.divIcon({
                html: `<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold; font-size: 14px;">${stop.sequence}</span>`, 
                className: 'stop-icon', 
                iconSize: [28, 28], 
                iconAnchor: [14, 14]
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
        
        // Reset bus marker position to start of new route
        const start = [parseFloat(route[0].lat), parseFloat(route[0].lng)];
        if (busMarker) {
            busMarker.setLatLng(start);
        } else {
            // Create bus marker if it doesn't exist
            const busIcon = L.divIcon({
                html: '🚌', 
                className: 'bus-icon', 
                iconSize: [36, 36], 
                iconAnchor: [18, 18]
            });
            busMarker = L.marker(start, { icon: busIcon }).addTo(map);
        }
        map.panTo(start, { animate: true, duration: 0.5 });
    }
    
    // Update ETA list
    updateETAList();
    updateStatus(`🔄 Switched to Bus ${VEHICLE_ID} - Fetching location...`);
    
    // Fetch vehicle details for the new bus
    fetchVehicleDetails();
    
    // Start tracking new bus
    startLiveLocationTracking();
}

// Initialize map
function initMap() {
    // Set initial view state - map view is active by default
    const container = document.querySelector('.container');
    if (container) {
        container.classList.add('map-view-active');
    }
    
    // Ensure route is set for default bus with time-based reversal
    const defaultBus = buses.find(bus => bus.id === VEHICLE_ID);
    if (defaultBus && defaultBus.route) {
        route = getRouteWithTimeReversal(defaultBus.route);
    }
    
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

    // Populate bus dropdown
    populateBusDropdown();
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('busDropdown');
        if (dropdown && !dropdown.contains(e.target)) {
            const options = document.getElementById('busSelectOptions');
            const selected = document.getElementById('busSelectDisplay');
            if (options && options.classList.contains('show')) {
                options.classList.remove('show');
                if (selected) selected.classList.remove('active');
            }
        }
    });
    
    // Initialize ETA list IMMEDIATELY
    updateETAList();
    updateStatus('✅ Ready - Fetching live location...');
    
    // Initialize current date display
    updateCurrentDate();
    // Update date every minute to keep it current
    setInterval(updateCurrentDate, 60000);
    
    // Initialize route direction tracking
    lastRouteDirection = shouldReverseRoute();
    
    // Check and update route direction when time crosses 5 PM
    checkAndUpdateRouteDirection();
    // Check every minute if route direction needs to change
    setInterval(checkAndUpdateRouteDirection, 60000);
    
    // Fetch vehicle details for the default bus
    fetchVehicleDetails();
    
    // Start fetching live bus location (animation will start automatically when location is received)
    startLiveLocationTracking();
}

// Check if route direction needs to be updated based on time
let lastRouteDirection = null; // Track last direction (false = normal 5 AM-5 PM, true = reversed 5 PM-5 AM)

function checkAndUpdateRouteDirection() {
    const currentDirection = shouldReverseRoute();
    
    // If direction changed, update the route
    if (lastRouteDirection !== null && lastRouteDirection !== currentDirection) {
        // Route direction changed - need to update
        const selectedBus = buses.find(bus => bus.id === VEHICLE_ID);
        if (selectedBus && selectedBus.route) {
            route = getRouteWithTimeReversal(selectedBus.route);
            
            // Reinitialize map with new route direction
            if (map && route.length > 0) {
                // Store bus marker reference before clearing
                const busMarkerExists = busMarker !== null && busMarker !== undefined;
                const busMarkerLatLng = busMarker ? busMarker.getLatLng() : null;
                
                // Clear existing map layers (markers and polylines, but preserve tile layer)
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                        map.removeLayer(layer);
                    }
                });
                
                // Reset bus marker reference if it was removed
                if (busMarkerExists) {
                    busMarker = null;
                }
                
                // Add new route line
                const latLngs = route.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
                L.polyline(latLngs, {color: '#e74c3c', weight: 4}).addTo(map);
                
                // Add new stop markers with ETA popups
                route.forEach((stop, i) => {
                    const stopIcon = L.divIcon({
                        html: `<span style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-weight: bold; font-size: 14px;">${stop.sequence}</span>`, 
                        className: 'stop-icon', 
                        iconSize: [28, 28], 
                        iconAnchor: [14, 14]
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
                
                // Reset bus marker position to start of new route
                const start = [parseFloat(route[0].lat), parseFloat(route[0].lng)];
                const busIcon = L.divIcon({
                    html: '🚌', 
                    className: 'bus-icon', 
                    iconSize: [36, 36], 
                    iconAnchor: [18, 18]
                });
                busMarker = L.marker(start, { icon: busIcon }).addTo(map);
                map.panTo(start, { animate: true, duration: 0.5 });
                
                // Reset state for new route direction
                currentBusLocation = null;
                currentStopIndex = -1;
                isBusAtStop = false;
                stopETAs = {};
                stopArrivalTimes = {};
                index = -1;
                step = 0;
                hasReceivedFirstLocation = false;
                
                // Update ETA list
                updateETAList();
                updateStatus(`🔄 Route direction updated - ${currentDirection ? 'Reverse (5 PM - 5 AM)' : 'Normal (5 AM - 5 PM)'}`);
            }
        }
    }
    
    // Update last direction
    lastRouteDirection = currentDirection;
}

// Proper ETA calculation with real-time Distance Matrix API data
function updateETAList() {
    const etaList = document.getElementById('eta-list');
    if (!etaList) return;
    
    // Keep the route line structure, only update stop items
    const existingItems = etaList.querySelectorAll('.eta-item');
    existingItems.forEach(item => item.remove());
    
    const now = Date.now();
    
    route.forEach((stop, i) => {
        let etaDisplay = '';
        let etaTime = '';
        let progressText = '';
        
        // Determine if this is the current stop based on live location
        const isCurrentStop = (currentStopIndex >= 0 && i === currentStopIndex);
        const isNextStop = (currentStopIndex >= 0 && i === currentStopIndex + 1);
        // A stop has passed if its index is less than currentStopIndex (not equal)
        const hasPassed = (currentStopIndex >= 0 && i < currentStopIndex) || (currentStopIndex < 0 && i < index);
        const hasETA = stopETAs[i] !== undefined;
        
        if (isCurrentStop) {
            // Current stop - show arrival time (record it if not already recorded)
            // Note: Arrival time will be set from API's lastPacket when location is fetched
            if (stopArrivalTimes[i]) {
                const arrivalTime = stopArrivalTimes[i];
                const timeStr = arrivalTime.toLocaleTimeString([], 
                    {hour: '2-digit', minute: '2-digit', second: '2-digit'});
                etaDisplay = `✅ Arrived: ${timeStr}`;
            } else {
                // Fallback to current time if not set yet
                const now = new Date();
                stopArrivalTimes[i] = now;
                const timeStr = now.toLocaleTimeString([], 
                    {hour: '2-digit', minute: '2-digit', second: '2-digit'});
                etaDisplay = `✅ Arrived: ${timeStr}`;
            }
        } else if (hasPassed) {
            // Past stops - show arrival time if available
            if (stopArrivalTimes[i]) {
                const arrivalTime = stopArrivalTimes[i];
                const timeStr = arrivalTime.toLocaleTimeString([], 
                    {hour: '2-digit', minute: '2-digit', second: '2-digit'});
                etaDisplay = `✅ Arrived: ${timeStr}`;
            }
        } else if (hasETA && currentBusLocation) {
            // Any future stop with real ETA from Distance Matrix API
            const etaSeconds = stopETAs[i];
            const etaMs = etaSeconds * 1000;
            const arrivalTime = new Date(now + etaMs);
            etaTime = arrivalTime.toLocaleTimeString([], 
                {hour: '2-digit', minute: '2-digit', second: '2-digit'});
            const etaMinutes = Math.ceil(etaSeconds / 60);
            etaDisplay = `ETA: ${etaTime}`;
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
        
        // Calculate minutes remaining for wifi box
        let wifiBoxHTML = '';
        if (!hasPassed && !isCurrentStop) {
            let minutesRemaining = null;
            if (hasETA && currentBusLocation) {
                // Use calculated ETA
                const etaSeconds = stopETAs[i];
                minutesRemaining = Math.max(1, Math.ceil(etaSeconds / 60));
            } else {
                // Estimate based on segments
                const remainingSegments = Math.max(0, i - (currentStopIndex >= 0 ? currentStopIndex : index));
                minutesRemaining = Math.ceil(remainingSegments * DURATION_PER_SEGMENT / 60000) || 1;
            }
            
            // Create wifi icon SVG
            const wifiIconSVG = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 9L3 11C7.97 6.03 16.03 6.03 21 11L23 9C16.93 2.93 7.07 2.93 1 9Z" fill="#ff9800"/>
                    <path d="M5 13L7 15C9.76 12.24 14.24 12.24 17 15L19 13C15.14 9.14 8.86 9.14 5 13Z" fill="#ff9800"/>
                    <circle cx="12" cy="19" r="2" fill="#ff9800"/>
                </svg>
            `;
            
            wifiBoxHTML = `
                <div class="eta-wifi-box">
                    <div class="eta-wifi-icon">${wifiIconSVG}</div>
                    <div class="eta-wifi-time">
                        <span class="eta-wifi-minutes">${minutesRemaining}</span>
                        <span class="eta-wifi-unit">min</span>
                    </div>
                </div>
            `;
        }
        
        const item = document.createElement('div');
        let itemClass = 'eta-item';
        if (hasPassed) {
            itemClass += ' passed';
        } else if (isCurrentStop) {
            itemClass += ' current';
        } else if (isNextStop) {
            itemClass += ' next';
        }
        item.className = itemClass;
        item.innerHTML = `
            <div class="stop-info">
                <div class="stop-info-left">
                    <i class="bi bi-bus-front stop-icon-small"></i>
                    <div class="stop-info-content">
                        <div class="stop-name">${stop.stop_name}</div>
                        <div class="eta-time">${etaDisplay}</div>
                    </div>
                </div>
            </div>
            ${wifiBoxHTML}
        `;
        etaList.appendChild(item);
    });
    
    // Update bus position after items are added (with small delay to ensure DOM is updated)
    setTimeout(() => {
        updateIntegratedLineBusPosition();
    }, 10);
}

// Animation disabled - bus position is updated directly from live location
function animateBus() {
    // Animation is disabled - position updates come from live location only
    return;
}

// Animation disabled - position updates come from live location only
function startAnimationFromLiveLocation() {
    // Animation is disabled - position updates come from live location only
    // This function is kept for compatibility but does nothing
    return;
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

// Haversine formula to calculate distance between two coordinates (in km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const toRad = deg => deg * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // km
}

// Calculate ETA using distance and speed
function calculateETA(geoA, geoB, speedKmph) {
    // Step 1: center-to-center distance
    let distanceKm = haversineDistance(
        geoA.lat, geoA.lng,
        geoB.lat, geoB.lng
    );

    // Step 2: subtract geofence radii
    distanceKm -= (geoA.radius / 1000);
    distanceKm -= (geoB.radius / 1000);

    if (distanceKm < 0) distanceKm = 0;

    // Step 3: ETA in minutes
    const etaMinutes = (distanceKm / speedKmph) * 60;

    return {
        distanceKm,
        etaMinutes
    };
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

// Calculate ETA from current bus location to a specific stop using Haversine formula
function calculateETAFromCurrentLocation(busLat, busLng, targetStopIndex) {
    if (targetStopIndex >= route.length || targetStopIndex < 0) {
        return null;
    }
    
    try {
        const targetStop = route[targetStopIndex];
        const destLat = parseFloat(targetStop.lat);
        const destLng = parseFloat(targetStop.lng);
        
        // Get current bus speed, use default if not available
        const speedKmph = vehicleDetails.speed && vehicleDetails.speed > 0 
            ? vehicleDetails.speed 
            : DEFAULT_BUS_SPEED_KMPH;
        
        // Create geo objects with radius
        const geoA = {
            lat: busLat,
            lng: busLng,
            radius: STOP_GEOFENCE_RADIUS_METERS // Current location geofence radius
        };
        
        const geoB = {
            lat: destLat,
            lng: destLng,
            radius: STOP_GEOFENCE_RADIUS_METERS // Stop geofence radius
        };
        
        // Calculate ETA
        const etaResult = calculateETA(geoA, geoB, speedKmph);
        
        // Convert ETA from minutes to seconds
        const durationSeconds = Math.max(1, Math.round(etaResult.etaMinutes * 60));
        
        // Store ETA
        stopETAs[targetStopIndex] = durationSeconds;
        
        // If animation is playing and this ETA is for the current segment, update segment duration
        if (isPlaying && targetStopIndex === index + 1 && step === 0) {
            // We're at the start of the segment, update duration
            currentSegmentDuration = durationSeconds * 1000;
            currentSegmentDuration = Math.max(currentSegmentDuration, 1000);
        }
        
        // Update ETA list with new data
        updateETAList();
        
        return durationSeconds;
    } catch (error) {
        console.error('Error calculating ETA:', error);
        return null;
    }
}

// Fetch vehicle details (odometer and driver name) from API
async function fetchVehicleDetails() {
    try {
        const response = await fetch(`${API_BASE_URL}/${VEHICLE_ID}`, {
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
            // Extract odometer and driver name
            // vehicleDetails.odometer = result.data.odometer || null; // Commented out - replaced with current date
            vehicleDetails.driverName = result.data.driver1?.fullname || null;
            
            // Update display
            updateVehicleDetailsDisplay();
            
            return vehicleDetails;
        } else {
            throw new Error('Invalid API response format');
        }
    } catch (error) {
        console.error('Error fetching vehicle details:', error);
        // Set to null on error
        // vehicleDetails.odometer = null; // Commented out - replaced with current date
        vehicleDetails.driverName = null;
        vehicleDetails.engineOn = null;
        vehicleDetails.speed = null;
        updateVehicleDetailsDisplay();
        return null;
    }
}

// Update current date display
function updateCurrentDate() {
    const dateElement = document.getElementById('vehicle-date');
    if (dateElement) {
        const now = new Date();
        const dateStr = now.toLocaleDateString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short'
        });
        dateElement.textContent = dateStr;
        dateElement.style.opacity = '1';
    }
}

// Update vehicle details display on screen
function updateVehicleDetailsDisplay() {
    // Odometer - commented out - replaced with current date
    // const odometerElement = document.getElementById('vehicle-odometer');
    const dateElement = document.getElementById('vehicle-date');
    const driverElement = document.getElementById('vehicle-driver');
    const engineElement = document.getElementById('vehicle-engine');
    const speedElement = document.getElementById('vehicle-speed');
    
    // Odometer display - commented out
    // if (odometerElement) {
    //     if (vehicleDetails.odometer !== null) {
    //         // Format odometer with thousand separators
    //         const formattedOdometer = vehicleDetails.odometer.toLocaleString('en-US', {
    //             maximumFractionDigits: 1,
    //             minimumFractionDigits: 1
    //         });
    //         odometerElement.textContent = `${formattedOdometer} km`;
    //         odometerElement.style.opacity = '1';
    //     } else {
    //         odometerElement.textContent = 'N/A';
    //         odometerElement.style.opacity = '0.6';
    //     }
    // }
    
    // Current date display
    updateCurrentDate();
    
    if (driverElement) {
        if (vehicleDetails.driverName) {
            driverElement.textContent = vehicleDetails.driverName;
            driverElement.style.opacity = '1';
        } else {
            driverElement.textContent = 'No driver assigned';
            driverElement.style.opacity = '0.6';
        }
    }
    
    if (engineElement) {
        if (vehicleDetails.engineOn !== null) {
            const engineStatus = vehicleDetails.engineOn ? '🟢 ON' : '🔴 OFF';
            engineElement.textContent = engineStatus;
            engineElement.style.opacity = '1';
            engineElement.style.color = vehicleDetails.engineOn ? '#2E7D32' : '#C62828';
        } else {
            engineElement.textContent = 'N/A';
            engineElement.style.opacity = '0.6';
            engineElement.style.color = '#333';
        }
    }
    
    if (speedElement) {
        if (vehicleDetails.speed !== null) {
            speedElement.textContent = `${Math.round(vehicleDetails.speed)} km/h`;
            speedElement.style.opacity = '1';
        } else {
            speedElement.textContent = 'N/A';
            speedElement.style.opacity = '0.6';
        }
    }
}

// Fetch live bus location from API
async function fetchLiveLocation() {
    try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`${API_BASE_URL}/${VEHICLE_ID}/status?withAddress=true`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${API_TOKEN}`
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            let errorMessage = `API error: ${response.status} ${response.statusText}`;
            if (response.status === 401) {
                errorMessage = 'Authentication failed - Check API token';
            } else if (response.status === 404) {
                errorMessage = `Vehicle ${VEHICLE_ID} not found`;
            } else if (response.status >= 500) {
                errorMessage = 'Server error - Please try again later';
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        
        // Check if response has expected structure
        if (!result) {
            throw new Error('Empty API response');
        }
        
        if (result.message === 'Success' && result.data) {
            const lat = parseFloat(result.data.latitude);
            const lng = parseFloat(result.data.longitude);
            
            // Extract engineOn status from API response - check multiple possible field names
            if (result.data.engineOn !== undefined) {
                vehicleDetails.engineOn = result.data.engineOn === true || result.data.engineOn === 'true' || result.data.engineOn === 1;
                console.log('Engine status extracted (engineOn):', vehicleDetails.engineOn);
            } else if (result.data.engine_on !== undefined) {
                vehicleDetails.engineOn = result.data.engine_on === true || result.data.engine_on === 'true' || result.data.engine_on === 1;
                console.log('Engine status extracted (engine_on):', vehicleDetails.engineOn);
            } else if (result.data.engine !== undefined) {
                vehicleDetails.engineOn = result.data.engine === true || result.data.engine === 'true' || result.data.engine === 1;
                console.log('Engine status extracted (engine):', vehicleDetails.engineOn);
            } else {
                // Log the data structure to help debug
                console.log('API response data keys:', Object.keys(result.data));
                console.log('Looking for engineOn in:', result.data);
            }
            
            // Extract speed from API response
            if (result.data.speed !== undefined) {
                vehicleDetails.speed = parseFloat(result.data.speed) || 0;
            }
            
            // Always update display when we have location data
            updateVehicleDetailsDisplay();
            
            if (!isNaN(lat) && !isNaN(lng)) {
                // Store current bus location
                currentBusLocation = { lat, lng };
                
                // Mark that we've received the first location
                if (!hasReceivedFirstLocation) {
                    hasReceivedFirstLocation = true;
                }
                
                // Determine current stop FIRST (before calculating animation position)
                const detectedStopIndex = determineCurrentStop(lat, lng);
                const nearestStop = route[detectedStopIndex];
                const nearestStopLat = parseFloat(nearestStop.lat);
                const nearestStopLng = parseFloat(nearestStop.lng);
                const distanceToNearest = calculateDistance(lat, lng, nearestStopLat, nearestStopLng);
                isBusAtStop = distanceToNearest <= STOP_PROXIMITY_METERS;
                
                // Check if we've reached a new stop
                const stopChanged = detectedStopIndex !== currentStopIndex;
                // Use API's lastPacket time if available, otherwise use current time
                const arrivalTime = result.data.lastPacket ? new Date(result.data.lastPacket) : new Date();
                
                if (stopChanged) {
                    // Record arrival times for stops that were just passed
                    if (currentStopIndex >= 0 && detectedStopIndex > currentStopIndex) {
                        // Bus moved forward - record arrival time for stops that were passed
                        for (let i = currentStopIndex; i < detectedStopIndex; i++) {
                            if (!stopArrivalTimes[i]) {
                                stopArrivalTimes[i] = arrivalTime;
                            }
                        }
                    }
                    currentStopIndex = detectedStopIndex;
                    // Clear ETAs for stops we've passed
                    for (let i = 0; i <= currentStopIndex; i++) {
                        delete stopETAs[i];
                    }
                }
                
                // If bus is at a stop and we haven't recorded arrival time yet, record it
                if (isBusAtStop && currentStopIndex >= 0 && !stopArrivalTimes[currentStopIndex]) {
                    stopArrivalTimes[currentStopIndex] = arrivalTime;
                }
                
                // IMPORTANT: Always sync index with currentStopIndex when bus is at stop
                // This ensures position calculation uses the correct stop
                if (isBusAtStop && currentStopIndex >= 0) {
                    index = currentStopIndex;
                    step = 0;
                }
                
                // Update bus position directly from live location (no animation)
                // If bus is at a stop, position it exactly at that stop
                if (busMarker && map) {
                    if (isBusAtStop && currentStopIndex >= 0) {
                        index = currentStopIndex;
                        step = 0;
                        // Position bus marker at the stop location
                        busMarker.setLatLng([parseFloat(nearestStop.lat), parseFloat(nearestStop.lng)]);
                    } else {
                        // Bus is moving - calculate position on route based on live location
                        const animPos = calculateAnimationPositionFromLiveLocation(lat, lng);
                        if (animPos) {
                            index = animPos.index;
                            step = animPos.step;
                        } else if (currentStopIndex >= 0) {
                            // Fallback: use current stop index
                            index = currentStopIndex;
                            step = 0;
                        }
                        // Update bus marker position directly from live location
                        busMarker.setLatLng([lat, lng]);
                    }
                    
                    map.panTo([lat, lng], { animate: true, duration: 0.5 });
                }
                
                // Update digital view position based on live location
                updateIntegratedLineBusPosition();
                
                // Calculate ETAs for future stops from current location
                // Calculate for next 3 stops to provide good ETA coverage
                const maxStopsToCalculate = Math.min(3, route.length - detectedStopIndex - 1);
                
                // Auto-refresh ETAs every 5 seconds for next stops
                for (let i = 0; i < maxStopsToCalculate; i++) {
                    const targetStopIndex = detectedStopIndex + 1 + i;
                    if (targetStopIndex < route.length) {
                        // Always refresh ETA for next stop, refresh others if they don't exist or stop changed
                        const shouldFetch = (i === 0) || (i > 0 && (!stopETAs[targetStopIndex] || stopChanged));
                        
                        if (shouldFetch) {
                            // Calculate ETA locally (synchronous, no API call needed)
                            calculateETAFromCurrentLocation(lat, lng, targetStopIndex);
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
                throw new Error(`Invalid coordinates: lat=${result.data.latitude}, lng=${result.data.longitude}`);
            }
        } else {
            // Check what the response actually contains
            if (result.message && result.message !== 'Success') {
                throw new Error(`API returned: ${result.message}`);
            } else if (!result.data) {
                throw new Error('API response missing data field');
            } else {
                throw new Error('Invalid API response format');
            }
        }
    } catch (error) {
        // Handle different error types
        let errorMessage = error.message;
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timeout - API took too long to respond';
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Network error - Check internet connection';
        }
        
        // Only update status if we haven't received a location yet, or if it's a new error
        if (!hasReceivedFirstLocation || errorMessage !== 'Network error - Check internet connection') {
            updateStatus(`⚠️ ${errorMessage} - Retrying...`);
        }
        
        console.error('Error fetching live location:', error);
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

// Manual refresh function - refreshes everything
async function manualRefresh() {
    const refreshButton = document.getElementById('refreshButton');
    
    // Add refreshing class for animation
    if (refreshButton) {
        refreshButton.classList.add('refreshing');
        refreshButton.disabled = true;
    }
    
    updateStatus('🔄 Refreshing...');
    
    try {
        // Fetch vehicle details
        await fetchVehicleDetails();
        
        // Fetch live location (this will also update ETAs)
        await fetchLiveLocation();
        
        // Update ETA list
        updateETAList();
        
        updateStatus('✅ Refreshed successfully');
    } catch (error) {
        console.error('Error during manual refresh:', error);
        updateStatus(`⚠️ Refresh error: ${error.message}`);
    } finally {
        // Remove refreshing class
        if (refreshButton) {
            refreshButton.classList.remove('refreshing');
            refreshButton.disabled = false;
        }
    }
}


// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}
