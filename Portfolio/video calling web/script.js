// Configuration
const config = {
    signalingServer: 'wss://your-signaling-server.com', // Replace with your signaling server
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Add your TURN server configuration if needed
        // {
        //     urls: 'turn:your-turn-server.com',
        //     username: 'username',
        //     credential: 'password'
        // }
    ],
    defaultResolution: '1280x720',
    defaultBitrate: 1000,
    walletBalance: 50.00, // Initial balance
    currentUser: 'User' + Math.floor(Math.random() * 1000),
    remoteUser: 'RemoteUser' + Math.floor(Math.random() * 1000),
    language: 'en'
};

// DOM Elements
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const localVideoContainer = document.getElementById('localVideoContainer');
const remoteVideoContainer = document.getElementById('remoteVideoContainer');
const startCallBtn = document.getElementById('startCall');
const endCallBtn = document.getElementById('endCall');
const muteAudioBtn = document.getElementById('muteAudio');
const muteVideoBtn = document.getElementById('muteVideo');
const recordToggleBtn = document.getElementById('recordToggle');
const takeSnapshotBtn = document.getElementById('takeSnapshot');
const showStatsBtn = document.getElementById('showStats');
const themeToggleBtn = document.getElementById('themeToggle');
const fullscreenToggleBtn = document.getElementById('fullscreenToggle');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');
const walletBalance = document.getElementById('walletBalance');
const resolutionOptions = document.querySelectorAll('.resolution-option');
const bitrateOptions = document.querySelectorAll('.bitrate-option');
const tipOptions = document.querySelectorAll('.tip-option');
const customTipAmount = document.getElementById('customTipAmount');
const sendCustomTipBtn = document.getElementById('sendCustomTip');
const confirmTipBtn = document.getElementById('confirmTip');
const languageOptions = document.querySelectorAll('.language-option');
const emoticonBtns = document.querySelectorAll('.emoticon');
const emoticonDropdown = document.getElementById('emoticonDropdown');
const snapshotImage = document.getElementById('snapshotImage');
const downloadSnapshotBtn = document.getElementById('downloadSnapshot');

// Modals
const statsModal = new bootstrap.Modal(document.getElementById('statsModal'));
const tipModal = new bootstrap.Modal(document.getElementById('tipModal'));
const snapshotModal = new bootstrap.Modal(document.getElementById('snapshotModal'));

// Global Variables
let localStream;
let remoteStream;
let peerConnection;
let signalingChannel;
let dataChannel;
let mediaRecorder;
let recordedChunks = [];
let isCalling = false;
let isAudioMuted = false;
let isVideoMuted = false;
let isRecording = false;
let currentResolution = config.defaultResolution;
let currentBitrate = config.defaultBitrate;
let pendingTipAmount = 0;
let statsInterval;
let currentTheme = 'dark';

// Initialize the application
async function init() {
    updateWalletDisplay();
    setupEventListeners();
    
    // Check permissions first
    const permissionsOk = await checkDevicePermissions();
    
    if (permissionsOk) {
        // Test media devices before attempting to connect
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideo = devices.some(device => device.kind === 'videoinput');
            const hasAudio = devices.some(device => device.kind === 'audioinput');
            
            if (!hasVideo) {
                addSystemMessage('No video device found. Please connect a camera.');
                startCallBtn.disabled = true;
            }
            if (!hasAudio) {
                addSystemMessage('No audio device found. Please connect a microphone.');
            }
            
            if (hasVideo || hasAudio) {
                await setupLocalStream();
                connectSignalingServer();
            } else {
                addSystemMessage('No camera or microphone devices found.');
                startCallBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error enumerating devices:', error);
            addSystemMessage('Error checking devices. Attempting to access camera anyway...');
            await setupLocalStream();
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    startCallBtn.addEventListener('click', startCall);
    endCallBtn.addEventListener('click', endCall);
    muteAudioBtn.addEventListener('click', toggleAudio);
    muteVideoBtn.addEventListener('click', toggleVideo);
    recordToggleBtn.addEventListener('click', toggleRecording);
    takeSnapshotBtn.addEventListener('click', takeSnapshot);
    showStatsBtn.addEventListener('click', showStats);
    themeToggleBtn.addEventListener('click', toggleTheme);
    fullscreenToggleBtn.addEventListener('click', toggleFullscreen);
    sendMessageBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    resolutionOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            changeResolution(option.dataset.value);
        });
    });
    
    bitrateOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            changeBitrate(parseInt(option.dataset.value));
        });
    });
    
    tipOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            prepareTip(parseFloat(option.dataset.amount));
        });
    });
    
    sendCustomTipBtn.addEventListener('click', () => {
        const amount = parseFloat(customTipAmount.value);
        if (amount && amount > 0) {
            prepareTip(amount);
        }
    });
    
    confirmTipBtn.addEventListener('click', sendTip);
    
    languageOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            changeLanguage(option.dataset.lang);
        });
    });
    
    emoticonBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            insertEmoticon(btn.dataset.emoji);
        });
    });
    
    downloadSnapshotBtn.addEventListener('click', downloadSnapshot);
}

// Set up local media stream with proper permission handling
async function setupLocalStream() {
    try {
        // First, check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia is not supported in this browser');
        }

        // Request permissions explicitly
        addSystemMessage('Requesting camera and microphone permissions...');
        
        const constraints = {
            audio: true,
            video: {
                width: { ideal: parseInt(currentResolution.split('x')[0]) },
                height: { ideal: parseInt(currentResolution.split('x')[1]) },
                frameRate: { ideal: 30 },
                facingMode: 'user' // Use front camera on mobile
            }
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Successfully got the stream
        localVideo.srcObject = localStream;
        addSystemMessage('Camera and microphone access granted');
        updateVideoResolutions();
        
        // Enable call controls
        startCallBtn.disabled = false;
        
    } catch (error) {
        console.error('Error accessing media devices:', error);
        handleMediaError(error);
    }
}

// Handle media access errors with specific messages
function handleMediaError(error) {
    let message = '';
    
    switch (error.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
            message = 'Camera and microphone access denied. Please allow permissions and refresh the page.';
            showPermissionDialog();
            break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
            message = 'No camera or microphone found. Please connect devices and refresh.';
            break;
        case 'NotReadableError':
        case 'TrackStartError':
            message = 'Camera or microphone is already in use by another application.';
            break;
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
            message = 'Camera settings not supported. Trying with default settings...';
            // Try with basic constraints
            retryWithBasicConstraints();
            return;
        case 'NotSupportedError':
            message = 'Camera and microphone are not supported in this browser.';
            break;
        case 'SecurityError':
            message = 'Security error. Please ensure you are using HTTPS.';
            break;
        default:
            message = `Media access error: ${error.message}`;
    }
    
    addSystemMessage(message);
    startCallBtn.disabled = true;
}

// Retry with basic constraints if advanced ones fail
async function retryWithBasicConstraints() {
    try {
        addSystemMessage('Retrying with basic camera settings...');
        
        const basicConstraints = {
            audio: true,
            video: true
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        localVideo.srcObject = localStream;
        addSystemMessage('Camera access successful with basic settings');
        updateVideoResolutions();
        startCallBtn.disabled = false;
        
    } catch (error) {
        console.error('Basic constraints also failed:', error);
        addSystemMessage('Unable to access camera with any settings. Please check your device.');
        startCallBtn.disabled = true;
    }
}

// Show permission dialog
function showPermissionDialog() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'permissionModal';
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Camera & Microphone Permission Required</h5>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-3">
                        <i class="bi bi-camera-video-off" style="font-size: 3rem; color: #dc3545;"></i>
                    </div>
                    <p>To use video calling, please:</p>
                    <ol>
                        <li>Click the camera icon in your browser's address bar</li>
                        <li>Select "Allow" for both camera and microphone</li>
                        <li>Refresh this page</li>
                    </ol>
                    <div class="alert alert-info">
                        <strong>Note:</strong> Your privacy is important. We only access your camera and microphone for video calls.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closePermissionDialog()">Close</button>
                    <button type="button" class="btn btn-primary" onclick="retryPermissions()">Try Again</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Close permission dialog
function closePermissionDialog() {
    const modal = document.getElementById('permissionModal');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal.hide();
        modal.remove();
    }
}

// Retry permissions
async function retryPermissions() {
    closePermissionDialog();
    await setupLocalStream();
}

// Check device permissions on page load
async function checkDevicePermissions() {
    try {
        // Check if permissions API is supported
        if ('permissions' in navigator) {
            const cameraPermission = await navigator.permissions.query({ name: 'camera' });
            const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
            
            console.log('Camera permission:', cameraPermission.state);
            console.log('Microphone permission:', microphonePermission.state);
            
            if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
                addSystemMessage('Camera or microphone access was previously denied. Please enable in browser settings.');
                showPermissionDialog();
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.log('Permissions API not supported:', error);
        return true; // Continue anyway
    }
}

// Connect to signaling server
function connectSignalingServer() {
    signalingChannel = new WebSocket(config.signalingServer);
    
    signalingChannel.onopen = () => {
        console.log('Connected to signaling server');
        addSystemMessage('Connected to signaling server');
    };
    
    signalingChannel.onclose = () => {
        console.log('Disconnected from signaling server');
        addSystemMessage('Disconnected from signaling server. Attempting to reconnect...');
        setTimeout(connectSignalingServer, 5000);
    };
    
    signalingChannel.onerror = (error) => {
        console.error('Signaling server error:', error);
    };
    
    signalingChannel.onmessage = async (message) => {
        const data = JSON.parse(message.data);
        
        if (!peerConnection && data.type === 'offer') {
            // Incoming call
            await createPeerConnection();
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            signalingChannel.send(JSON.stringify(answer));
            
            isCalling = true;
            updateCallButtons();
            addSystemMessage('Incoming call...');
        } else if (data.type === 'answer' && peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
        } else if (data.type === 'candidate' && peerConnection) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch (error) {
                console.error('Error adding ICE candidate:', error);
            }
        } else if (data.type === 'chat') {
            // Handle incoming chat message
            addChatMessage(data.sender, data.message, false);
        } else if (data.type === 'tip') {
            // Handle incoming tip
            handleIncomingTip(data.amount, data.sender);
        } else if (data.type === 'hangup') {
            // Remote party hung up
            endCall();
        }
    };
}

// Create RTCPeerConnection
async function createPeerConnection() {
    peerConnection = new RTCPeerConnection({
        iceServers: config.iceServers
    });
    
    // Add local stream to connection
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
    
    // Set up data channel for chat
    dataChannel = peerConnection.createDataChannel('chat', {
        ordered: true,
        maxPacketLifeTime: 3000
    });
    
    dataChannel.onopen = () => {
        console.log('Data channel opened');
        addSystemMessage('Chat connection established');
    };
    
    dataChannel.onclose = () => {
        console.log('Data channel closed');
    };
    
    dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
            addChatMessage(data.sender, data.message, false);
        } else if (data.type === 'tip') {
            handleIncomingTip(data.amount, data.sender);
        }
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            signalingChannel.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate
            }));
        }
    };
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        remoteVideo.srcObject = remoteStream;
        updateVideoResolutions();
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'disconnected' || 
            peerConnection.connectionState === 'failed') {
            endCall();
        }
    };
    
    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.iceConnectionState);
    };
}

// Start a call
async function startCall() {
    if (!peerConnection) {
        await createPeerConnection();
    }
    
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        signalingChannel.send(JSON.stringify(offer));
        
        isCalling = true;
        updateCallButtons();
        addSystemMessage('Call started...');
    } catch (error) {
        console.error('Error starting call:', error);
        addSystemMessage('Failed to start call');
    }
}

// End the call
function endCall() {
    if (peerConnection) {
        if (dataChannel) dataChannel.close();
        peerConnection.close();
        peerConnection = null;
        dataChannel = null;
    }
    
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }
    
    if (isRecording) {
        stopRecording();
    }
    
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
    
    isCalling = false;
    updateCallButtons();
    
    // Notify remote peer
    if (signalingChannel.readyState === WebSocket.OPEN) {
        signalingChannel.send(JSON.stringify({ type: 'hangup' }));
    }
    
    addSystemMessage('Call ended');
}

// Toggle audio mute
function toggleAudio() {
    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
            isAudioMuted = !audioTracks[0].enabled;
            audioTracks[0].enabled = !isAudioMuted;
            muteAudioBtn.innerHTML = isAudioMuted ? '<i class="bi bi-mic-mute-fill"></i>' : '<i class="bi bi-mic-fill"></i>';
            playSoundEffect(isAudioMuted ? 'mute' : 'unmute');
        }
    }
}

// Toggle video mute
function toggleVideo() {
    if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
            isVideoMuted = !videoTracks[0].enabled;
            videoTracks[0].enabled = !isVideoMuted;
            muteVideoBtn.innerHTML = isVideoMuted ? '<i class="bi bi-camera-video-off-fill"></i>' : '<i class="bi bi-camera-video-fill"></i>';
            playSoundEffect(isVideoMuted ? 'mute' : 'unmute');
        }
    }
}

// Toggle recording
function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

// Start recording
function startRecording() {
    if (!remoteStream) return;
    
    recordedChunks = [];
    const options = { mimeType: 'video/webm;codecs=vp9' };
    
    try {
        mediaRecorder = new MediaRecorder(remoteStream, options);
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `videowhisper-recording-${new Date().toISOString()}.webm`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        };
        
        mediaRecorder.start(1000); // Collect data every second
        isRecording = true;
        recordToggleBtn.innerHTML = '<i class="bi bi-stop-circle-fill"></i>';
        addSystemMessage('Recording started');
        playSoundEffect('recordStart');
    } catch (error) {
        console.error('Error starting recording:', error);
        addSystemMessage('Failed to start recording');
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        recordToggleBtn.innerHTML = '<i class="bi bi-record-circle"></i>';
        addSystemMessage('Recording stopped');
        playSoundEffect('recordStop');
    }
}

// Take snapshot
function takeSnapshot() {
    if (!remoteVideo.videoWidth || !remoteVideo.videoHeight) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = remoteVideo.videoWidth;
    canvas.height = remoteVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
    
    snapshotImage.src = canvas.toDataURL('image/png');
    snapshotModal.show();
    playSoundEffect('snapshot');
}

// Download snapshot
function downloadSnapshot() {
    const link = document.createElement('a');
    link.download = `videowhisper-snapshot-${new Date().toISOString()}.png`;
    link.href = snapshotImage.src;
    link.click();
    playSoundEffect('download');
}

// Show connection stats
function showStats() {
    if (!peerConnection) return;
    
    statsModal.show();
    
    // Update stats immediately and then every second
    updateStats();
    if (!statsInterval) {
        statsInterval = setInterval(updateStats, 1000);
    }
    
    // Clear interval when modal is closed
    statsModal._element.addEventListener('hidden.bs.modal', () => {
        if (statsInterval) {
            clearInterval(statsInterval);
            statsInterval = null;
        }
    }, { once: true });
}

// Update stats display
async function updateStats() {
    if (!peerConnection) return;
    
    try {
        const stats = await peerConnection.getStats();
        let localVideoStats = {};
        let remoteVideoStats = {};
        let candidatePair = {};
        
        stats.forEach(report => {
            if (report.type === 'outbound-rtp' && report.kind === 'video') {
                localVideoStats = report;
            } else if (report.type === 'inbound-rtp' && report.kind === 'video') {
                remoteVideoStats = report;
            } else if (report.type === 'candidate-pair' && report.nominated) {
                candidatePair = report;
            }
        });
        
        // Local video stats
        if (localVideoStats.frameWidth) {
            document.getElementById('statsLocalResolution').textContent = 
                `${localVideoStats.frameWidth}x${localVideoStats.frameHeight}`;
            document.getElementById('statsLocalFramerate').textContent = 
                localVideoStats.framesPerSecond || '-';
        }
        
        if (localVideoStats.bitrate) {
            document.getElementById('statsLocalBitrate').textContent = 
                Math.round(localVideoStats.bitrate / 1000);
        }
        
        // Remote video stats
        if (remoteVideoStats.frameWidth) {
            document.getElementById('statsRemoteResolution').textContent = 
                `${remoteVideoStats.frameWidth}x${remoteVideoStats.frameHeight}`;
            document.getElementById('statsRemoteFramerate').textContent = 
                remoteVideoStats.framesPerSecond || '-';
        }
        
        if (remoteVideoStats.bitrate) {
            document.getElementById('statsRemoteBitrate').textContent = 
                Math.round(remoteVideoStats.bitrate / 1000);
        }
        
        // Connection stats
        if (candidatePair.localCandidateId && candidatePair.remoteCandidateId) {
            const localCandidate = stats.get(candidatePair.localCandidateId);
            const remoteCandidate = stats.get(candidatePair.remoteCandidateId);
            
            let connectionType = 'Unknown';
            if (localCandidate && remoteCandidate) {
                if (localCandidate.candidateType === 'relay' || remoteCandidate.candidateType === 'relay') {
                    connectionType = 'TURN Relay';
                } else if (localCandidate.candidateType === 'srflx' || remoteCandidate.candidateType === 'srflx') {
                    connectionType = 'STUN (NAT traversal)';
                } else {
                    connectionType = 'Direct P2P';
                }
            }
            
            document.getElementById('statsConnectionType').textContent = connectionType;
            document.getElementById('statsRTT').textContent = candidatePair.currentRoundTripTime ? 
                Math.round(candidatePair.currentRoundTripTime * 1000) : '-';
            document.getElementById('statsPacketsLost').textContent = 
                remoteVideoStats.packetsLost || '0';
        }
    } catch (error) {
        console.error('Error getting stats:', error);
    }
}

// Toggle theme
function toggleTheme() {
    const html = document.documentElement;
    if (currentTheme === 'dark') {
        html.setAttribute('data-bs-theme', 'light');
        themeToggleBtn.innerHTML = '<i class="bi bi-moon-fill"></i>';
        currentTheme = 'light';
    } else {
        html.setAttribute('data-bs-theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
        currentTheme = 'dark';
    }
    playSoundEffect('toggle');
}

// Toggle fullscreen
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
    playSoundEffect('toggle');
}

// Send chat message
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Check for mentions
    const processedMessage = processMentions(message);
    
    // Add to local chat
    addChatMessage(config.currentUser, processedMessage, true);
    
    // Send to remote peer
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({
            type: 'chat',
            sender: config.currentUser,
            message: processedMessage
        }));
    } else if (signalingChannel.readyState === WebSocket.OPEN) {
        signalingChannel.send(JSON.stringify({
            type: 'chat',
            sender: config.currentUser,
            message: processedMessage
        }));
    }
    
    chatInput.value = '';
    playSoundEffect('message');
}

// Add chat message to UI
function addChatMessage(sender, message, isLocal) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isLocal ? 'local-message' : 'remote-message');
    
    const senderSpan = document.createElement('span');
    senderSpan.classList.add('fw-bold');
    senderSpan.textContent = sender + ': ';
    
    messageDiv.appendChild(senderSpan);
    messageDiv.innerHTML += message;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add system message to chat
function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'system-message');
    messageDiv.textContent = message;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    playSoundEffect('notification');
}

// Process mentions in chat messages
function processMentions(message) {
    // Simple mention detection - @username
    return message.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

// Insert emoticon into chat input
function insertEmoticon(emoji) {
    chatInput.value += emoji;
    emoticonDropdown.click(); // Close the dropdown
    playSoundEffect('emoticon');
}

// Prepare to send a tip
function prepareTip(amount) {
    if (amount > config.walletBalance) {
        addSystemMessage('Insufficient funds in your wallet');
        playSoundEffect('error');
        return;
    }
    
    pendingTipAmount = amount;
    document.getElementById('tipAmountDisplay').textContent = '$' + amount.toFixed(2);
    document.getElementById('tipRecipient').textContent = config.remoteUser;
    
    // Set gift image based on amount
    const giftImage = document.getElementById('tipGiftImage');
    if (amount < 5) {
        giftImage.textContent = '☕';
    } else if (amount < 10) {
        giftImage.textContent = '🍔';
    } else if (amount < 20) {
        giftImage.textContent = '�';
    } else {
        giftImage.textContent = '🎁';
    }
    
    tipModal.show();
    playSoundEffect('tip');
}

// Send tip
function sendTip() {
    config.walletBalance -= pendingTipAmount;
    updateWalletDisplay();
    
    // Send tip to remote peer
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({
            type: 'tip',
            sender: config.currentUser,
            amount: pendingTipAmount
        }));
    } else if (signalingChannel.readyState === WebSocket.OPEN) {
        signalingChannel.send(JSON.stringify({
            type: 'tip',
            sender: config.currentUser,
            amount: pendingTipAmount
        }));
    }
    
    // Show tip animation
    showTipAnimation(pendingTipAmount);
    tipModal.hide();
    playSoundEffect('tipSent');
}

// Handle incoming tip
function handleIncomingTip(amount, sender) {
    config.walletBalance += amount;
    updateWalletDisplay();
    addSystemMessage(`Received $${amount.toFixed(2)} tip from ${sender}!`);
    showTipAnimation(amount, true);
    playSoundEffect('tipReceived');
}

// Show tip animation
function showTipAnimation(amount, isIncoming = false) {
    const container = isIncoming ? localVideoContainer : remoteVideoContainer;
    const tipElement = document.createElement('div');
    tipElement.classList.add('tip-notification');
    
    // Set emoji based on amount
    let emoji = '💵';
    if (amount >= 20) emoji = '💰';
    if (amount >= 50) emoji = '🤑';
    
    tipElement.textContent = emoji + (isIncoming ? '+' : '-') + '$' + amount.toFixed(2);
    tipElement.style.color = isIncoming ? '#28a745' : '#dc3545';
    
    // Random position
    const x = Math.random() * 80 + 10;
    const y = Math.random() * 80 + 10;
    tipElement.style.left = `${x}%`;
    tipElement.style.top = `${y}%`;
    
    container.appendChild(tipElement);
    
    // Remove after animation
    setTimeout(() => {
        tipElement.remove();
    }, 2000);
}

// Change video resolution
async function changeResolution(resolution) {
    if (resolution === currentResolution) return;
    
    currentResolution = resolution;
    const [width, height] = resolution.split('x').map(Number);
    
    try {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            await videoTrack.applyConstraints({
                width: { ideal: width },
                height: { ideal: height }
            });
            
            updateVideoResolutions();
            addSystemMessage(`Resolution changed to ${resolution}`);
            playSoundEffect('settings');
        }
    } catch (error) {
        console.error('Error changing resolution:', error);
        addSystemMessage('Failed to change resolution');
    }
}

// Change video bitrate
function changeBitrate(bitrate) {
    if (bitrate === currentBitrate) return;
    
    currentBitrate = bitrate;
    
    if (peerConnection && localStream) {
        const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
        );
        
        if (sender) {
            const parameters = sender.getParameters();
            if (!parameters.encodings) {
                parameters.encodings = [{}];
            }
            parameters.encodings[0].maxBitrate = bitrate * 1000;
            sender.setParameters(parameters)
                .then(() => {
                    addSystemMessage(`Bitrate changed to ${bitrate} kbps`);
                    playSoundEffect('settings');
                })
                .catch(error => {
                    console.error('Error changing bitrate:', error);
                    addSystemMessage('Failed to change bitrate');
                });
        }
    }
}

// Change language
function changeLanguage(lang) {
    config.language = lang;
    addSystemMessage(`Language set to ${getLanguageName(lang)}`);
    playSoundEffect('language');
}

// Get language name from code
function getLanguageName(code) {
    const languages = {
        en: 'English',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch',
        ja: '日本語'
    };
    return languages[code] || code;
}

// Update video resolution displays
function updateVideoResolutions() {
    if (localVideo.videoWidth && localVideo.videoHeight) {
        document.getElementById('localResolution').textContent = 
            `${localVideo.videoWidth}x${localVideo.videoHeight}`;
    }
    
    if (remoteVideo.videoWidth && remoteVideo.videoHeight) {
        document.getElementById('remoteResolution').textContent = 
            `${remoteVideo.videoWidth}x${remoteVideo.videoHeight}`;
    }
}

// Update call buttons based on call state
function updateCallButtons() {
    const hasLocalStream = localStream && localStream.active;
    
    startCallBtn.disabled = isCalling || !hasLocalStream;
    endCallBtn.disabled = !isCalling;
    recordToggleBtn.disabled = !isCalling || !remoteVideo.srcObject;
    takeSnapshotBtn.disabled = !isCalling || !remoteVideo.srcObject;
    
    // Show/hide no video message
    const noVideoMessage = document.getElementById('noVideoMessage');
    if (noVideoMessage) {
        noVideoMessage.style.display = (!remoteVideo.srcObject && isCalling) ? 'block' : 'none';
    }
}

// Update wallet balance display
function updateWalletDisplay() {
    walletBalance.textContent = config.walletBalance.toFixed(2);
}

// Play sound effect
function playSoundEffect(type) {
    // In a real implementation, you would play actual sound files
    console.log(`Playing sound effect: ${type}`);
    
    // Visual feedback for sound effects
    const soundEffect = document.createElement('span');
    soundEffect.classList.add('sound-effect');
    soundEffect.innerHTML = '<i class="bi bi-speaker-fill"></i>';
    
    const target = type === 'message' ? sendMessageBtn : 
                   type === 'tip' ? tipDropdown : 
                   type === 'emoticon' ? emoticonDropdown : 
                   themeToggleBtn;
    
    target.appendChild(soundEffect);
    setTimeout(() => soundEffect.remove(), 500);
}

// Add device change listener
if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', async () => {
        console.log('Media devices changed');
        addSystemMessage('Media devices changed. You may need to refresh.');
    });
}

// Add refresh camera function
async function refreshCamera() {
    try {
        // Stop existing stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        addSystemMessage('Refreshing camera...');
        await setupLocalStream();
        
    } catch (error) {
        console.error('Error refreshing camera:', error);
        addSystemMessage('Failed to refresh camera. Please check permissions.');
    }
}
