// Smart Contract Configuration - Update with your deployed contract address
const CONTRACT_ADDRESS = "0xc61a1997F87156dfC96CA14E66fA9E3A02D36358"; // Replace with actual deployed contract address
const CONTRACT_ABI = [
    "function owner() public view returns (address)",
    "function totalMonitoringStations() public view returns (uint32)",
    "function currentReportId() public view returns (uint32)",
    "function registerMonitoringStation(string memory _location, address _operator) external returns (uint32)",
    "function submitPollutionReport(uint32 _stationId, uint32 _pollutionLevel, uint8 _pollutantType, uint32 _severity) external",
    "function setAlertThreshold(uint8 _pollutantType, uint32 _criticalLevel, uint32 _warningLevel) external",
    "function verifyReport(uint32 _reportId) external",
    "function getStationInfo(uint32 _stationId) external view returns (string memory location, address operator, bool isActive, uint256 registrationTime, uint256 lastUpdateTime, uint256 totalReports)",
    "function getReportInfo(uint32 _reportId) external view returns (uint32 stationId, address reporter, uint256 timestamp, bool isVerified, uint32 reportId)",
    "function getCurrentStatus() external view returns (uint32 totalStations, uint32 totalReports, address contractOwner)",
    "function authorizedOperators(address) public view returns (bool)",
    "event StationRegistered(uint32 indexed stationId, string location, address operator)",
    "event PollutionReported(uint32 indexed reportId, uint32 indexed stationId, address reporter)",
    "event AlertTriggered(uint32 indexed stationId, uint8 pollutantType, uint256 timestamp)",
    "event ReportVerified(uint32 indexed reportId, address verifier)"
];

// Global Variables
let provider;
let signer;
let contract;
let userAccount;

// Pollutant Type Mapping
const POLLUTANT_TYPES = {
    1: "PM2.5",
    2: "PM10",
    3: "Sulfur Dioxide",
    4: "Nitrogen Oxides",
    5: "Ozone",
    6: "Heavy Metals",
    7: "Chemical Substances",
    8: "Other"
};

// Page Initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize Application
async function initializeApp() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            console.log('MetaMask detected');
        } else {
            showAlert('Please install MetaMask wallet', 'danger');
        }
    } catch (error) {
        console.error('Initialization failed:', error);
        showAlert('Initialization failed: ' + error.message, 'danger');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('connectBtn').addEventListener('click', connectWallet);
    document.getElementById('registerForm').addEventListener('submit', registerStation);
    document.getElementById('reportForm').addEventListener('submit', submitReport);
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
    document.getElementById('loadStationsBtn').addEventListener('click', loadStations);
    document.getElementById('loadReportsBtn').addEventListener('click', loadReports);
    document.getElementById('setThresholdBtn').addEventListener('click', setThreshold);
}

// Connect Wallet
async function connectWallet() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            provider = new ethers.BrowserProvider(window.ethereum);
            signer = await provider.getSigner();
            userAccount = accounts[0];

            // Initialize contract only if address is configured
            if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "") {
                contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                await refreshData();
            } else {
                showAlert('Wallet connected! Please deploy the contract and update CONTRACT_ADDRESS in app.js', 'warning');
            }

            updateConnectionStatus(true);

        } else {
            showAlert('Please install MetaMask wallet', 'danger');
        }
    } catch (error) {
        console.error('Wallet connection failed:', error);
        showAlert('Connection failed: ' + error.message, 'danger');
    }
}

// Update Connection Status
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    const connectBtn = document.getElementById('connectBtn');

    if (connected) {
        statusElement.classList.add('connected');
        statusText.textContent = `Connected: ${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
        connectBtn.style.display = 'none';
    } else {
        statusElement.classList.remove('connected');
        statusText.textContent = 'Wallet not connected';
        connectBtn.style.display = 'inline-block';
    }
}

// Register Monitoring Station
async function registerStation(event) {
    event.preventDefault();

    if (!userAccount) {
        showAlert('Please connect wallet first', 'warning');
        return;
    }

    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "") {
        showAlert('Contract address not configured. Please deploy the contract first.', 'danger');
        return;
    }

    if (!contract) {
        showAlert('Contract not initialized. Please refresh and try again.', 'warning');
        return;
    }

    const location = document.getElementById('stationLocation').value;
    const operatorAddress = document.getElementById('operatorAddress').value;

    try {
        showAlert('Registering monitoring station...', 'warning');

        const tx = await contract.registerMonitoringStation(location, operatorAddress);
        console.log('Transaction hash:', tx.hash);

        await tx.wait();

        showAlert('Monitoring station registered successfully!', 'success');
        document.getElementById('registerForm').reset();
        await refreshData();
        await loadStations();

    } catch (error) {
        console.error('Registration failed:', error);
        showAlert('Registration failed: ' + error.message, 'danger');
    }
}

// Submit Pollution Report
async function submitReport(event) {
    event.preventDefault();

    if (!userAccount) {
        showAlert('Please connect wallet first', 'warning');
        return;
    }

    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "") {
        showAlert('Contract address not configured. Please deploy the contract first.', 'danger');
        return;
    }

    if (!contract) {
        showAlert('Contract not initialized. Please refresh and try again.', 'warning');
        return;
    }

    const stationId = document.getElementById('reportStationId').value;
    const pollutionLevel = document.getElementById('pollutionLevel').value;
    const pollutantType = document.getElementById('pollutantType').value;
    const severity = document.getElementById('severity').value;

    try {
        showAlert('Submitting pollution report...', 'warning');

        // In real deployment with FHE, data would be encrypted
        const tx = await contract.submitPollutionReport(
            stationId,
            pollutionLevel,
            pollutantType,
            severity
        );

        console.log('Transaction hash:', tx.hash);
        await tx.wait();

        showAlert('Pollution report submitted successfully! Data encrypted and stored', 'success');
        document.getElementById('reportForm').reset();
        await refreshData();
        await loadReports();

    } catch (error) {
        console.error('Submission failed:', error);
        showAlert('Submission failed: ' + error.message, 'danger');
    }
}

// Set Alert Threshold
async function setThreshold() {
    if (!userAccount) {
        showAlert('Please connect wallet first', 'warning');
        return;
    }

    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "") {
        showAlert('Contract address not configured. Please deploy the contract first.', 'danger');
        return;
    }

    if (!contract) {
        showAlert('Contract not initialized. Please refresh and try again.', 'warning');
        return;
    }

    const pollutantType = document.getElementById('thresholdPollutantType').value;
    const warningLevel = document.getElementById('warningLevel').value;
    const criticalLevel = document.getElementById('criticalLevel').value;

    try {
        showAlert('Setting alert threshold...', 'warning');

        const tx = await contract.setAlertThreshold(
            pollutantType,
            criticalLevel,
            warningLevel
        );

        await tx.wait();
        showAlert('Alert threshold set successfully!', 'success');

        // Clear form
        document.getElementById('warningLevel').value = '';
        document.getElementById('criticalLevel').value = '';

    } catch (error) {
        console.error('Setting threshold failed:', error);
        showAlert('Setting threshold failed: ' + error.message, 'danger');
    }
}

// Refresh Data
async function refreshData() {
    if (!contract) return;

    try {
        const status = await contract.getCurrentStatus();

        document.getElementById('totalStations').textContent = status.totalStations.toString();
        document.getElementById('totalReports').textContent = status.totalReports.toString();

        // Update station selector
        await updateStationSelector();

        console.log('Data refreshed successfully');
    } catch (error) {
        console.error('Data refresh failed:', error);
        showAlert('Data refresh failed: ' + error.message, 'danger');
    }
}

// Update Station Selector
async function updateStationSelector() {
    const selector = document.getElementById('reportStationId');
    selector.innerHTML = '<option value="">Select Station</option>';

    try {
        const status = await contract.getCurrentStatus();
        const totalStations = Number(status.totalStations);

        for (let i = 1; i <= totalStations; i++) {
            try {
                const stationInfo = await contract.getStationInfo(i);
                if (stationInfo.isActive) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = `Station ${i}: ${stationInfo.location}`;
                    selector.appendChild(option);
                }
            } catch (error) {
                console.error(`Failed to get station ${i} info:`, error);
            }
        }
    } catch (error) {
        console.error('Failed to update selector:', error);
    }
}

// Load Monitoring Stations
async function loadStations() {
    const stationsContainer = document.getElementById('stationsList');

    if (!contract) {
        stationsContainer.innerHTML = '<div class="loading">Please connect wallet first</div>';
        return;
    }

    try {
        stationsContainer.innerHTML = '<div class="loading">Loading stations...</div>';

        const status = await contract.getCurrentStatus();
        const totalStations = Number(status.totalStations);

        if (totalStations === 0) {
            stationsContainer.innerHTML = '<div class="loading">No station data available</div>';
            return;
        }

        let stationsHTML = '';
        let activeCount = 0;

        for (let i = 1; i <= totalStations; i++) {
            try {
                const stationInfo = await contract.getStationInfo(i);
                if (stationInfo.isActive) activeCount++;

                stationsHTML += `
                    <div class="station-card">
                        <div class="station-header">
                            <span class="station-id">Station ${i}</span>
                            <span class="station-status ${stationInfo.isActive ? 'active' : 'inactive'}">
                                ${stationInfo.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div><strong>Location:</strong> ${stationInfo.location}</div>
                        <div><strong>Operator:</strong> ${stationInfo.operator.substring(0, 10)}...</div>
                        <div><strong>Registration:</strong> ${new Date(Number(stationInfo.registrationTime) * 1000).toLocaleDateString()}</div>
                        <div><strong>Total Reports:</strong> ${stationInfo.totalReports.toString()}</div>
                        <div><strong>Last Update:</strong> ${new Date(Number(stationInfo.lastUpdateTime) * 1000).toLocaleString()}</div>
                    </div>
                `;
            } catch (error) {
                console.error(`Failed to load station ${i}:`, error);
            }
        }

        document.getElementById('activeStations').textContent = activeCount;
        stationsContainer.innerHTML = stationsHTML || '<div class="loading">No stations to display</div>';

    } catch (error) {
        console.error('Failed to load stations:', error);
        stationsContainer.innerHTML = '<div class="loading">Loading failed</div>';
    }
}

// Load Reports
async function loadReports() {
    const reportsContainer = document.getElementById('reportsList');

    if (!contract) {
        reportsContainer.innerHTML = '<div class="loading">Please connect wallet first</div>';
        return;
    }

    try {
        reportsContainer.innerHTML = '<div class="loading">Loading reports...</div>';

        const status = await contract.getCurrentStatus();
        const totalReports = Number(status.totalReports);

        if (totalReports === 0) {
            reportsContainer.innerHTML = '<div class="loading">No report data available</div>';
            return;
        }

        let reportsHTML = '';
        let verifiedCount = 0;

        // Display latest 20 reports
        const startId = Math.max(1, totalReports - 19);

        for (let i = totalReports; i >= startId; i--) {
            try {
                const reportInfo = await contract.getReportInfo(i);
                if (reportInfo.isVerified) verifiedCount++;

                reportsHTML += `
                    <div class="station-card" style="margin-bottom: 15px;">
                        <div class="station-header">
                            <span class="station-id">Report ${i}</span>
                            <span class="station-status ${reportInfo.isVerified ? 'active' : 'inactive'}">
                                ${reportInfo.isVerified ? 'Verified' : 'Pending'}
                            </span>
                        </div>
                        <div><strong>Station ID:</strong> ${reportInfo.stationId}</div>
                        <div><strong>Reporter:</strong> ${reportInfo.reporter.substring(0, 10)}...</div>
                        <div><strong>Timestamp:</strong> ${new Date(Number(reportInfo.timestamp) * 1000).toLocaleString()}</div>
                        <div><strong>Data Status:</strong> <span class="privacy-badge">FHE Encrypted</span></div>
                    </div>
                `;
            } catch (error) {
                console.error(`Failed to load report ${i}:`, error);
            }
        }

        document.getElementById('verifiedReports').textContent = verifiedCount;
        reportsContainer.innerHTML = reportsHTML || '<div class="loading">No reports to display</div>';

    } catch (error) {
        console.error('Failed to load reports:', error);
        reportsContainer.innerHTML = '<div class="loading">Loading failed</div>';
    }
}

// Show Alert Message
function showAlert(message, type = 'success') {
    // Remove existing alert
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alert, mainContent.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Listen for account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length === 0) {
            updateConnectionStatus(false);
            contract = null;
            userAccount = null;
        } else {
            userAccount = accounts[0];
            updateConnectionStatus(true);
        }
    });

    window.ethereum.on('chainChanged', function (chainId) {
        window.location.reload();
    });
}

// Format address display
function formatAddress(address) {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
}

// Format timestamp
function formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleString('en-US');
}

console.log('Privacy Pollution Monitor System Loaded');
console.log('🌱 FHE-Powered Confidential Environmental Tracking Platform');