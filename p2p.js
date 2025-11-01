class P2PDataChannel {
	constructor() {
		this.device = null;
		this.dataChannel = null;
		this.iceList = [];
		this.isInitiator = null;

		// Functions set in main.js
		this.onSignalGenerated = (signal) => {};
		this.onDataReceived = (data) => {};
	}

	// Runs on both initiator and answerer side
	initialize() {
		this.device = new RTCPeerConnection({iceServers: [{urls: "stun:stun.l.google.com:19302"}]});
		this.iceList = [];

		// RTCPeerConnection will generate ice candidates (a possible network address to connect to peer) using the stun server define above.
		// These ice candidates will be sent to other peer along with the SDP.
		this.device.onicecandidate = ({ candidate }) => {
			if (candidate != null) {
				// Add new candidate
				this.iceList.push(candidate);
			} else {
				// End of candidates
				let input = JSON.stringify({
					sdp: this.device.localDescription,
					iceList: this.iceList
				}, null, 2);

				if (this.isInitiator) {
					// Create a URL with a hash
					input = document.URL + "#offer=" + encodeURIComponent(input);
				}
				
				// Send  generated signal to main.js
				this.onSignalGenerated(input);
			}
		};

		// Answerer setup for data channel
		this.device.ondatachannel = (event) => {
			this.dataChannel = event.channel;
			this.dataChannel.onmessage = (event) => this.onDataReceived(event.data);
		};
	}

	// Runs on initiator side
	async createOffer() {
		this.isInitiator = true;
		this.initialize(true);

		// Initiator creates data channel
		let dc = this.device.createDataChannel("dataChannel");
		this.dataChannel = dc;
		this.dataChannel.onmessage = (event) => this.onDataReceived(event.data);

		// Initiator SDP created here
		let offer = await this.device.createOffer();
		await this.device.setLocalDescription(offer);
	}

	// Runs on both initiator and answerer side
	async process(text) {
		// Hide the input field and start button
		document.getElementById("input").style.display = "none";
		document.getElementById("process").style.display = "none";
		
		let input = JSON.parse(text);
		let otherSDP = input.sdp;
		let otherIceList = input.iceCandidates || [];
		
		if (!this.device) {
			this.isInitiator = false;
			this.initialize();
		}
		
		// Set remote SDP
		await this.device.setRemoteDescription(new RTCSessionDescription(otherSDP));

		// Set remote ice candidates
		otherIceList.forEach(candidate => {
			this.device.addIceCandidate(new RTCIceCandidate(candidate))
		});

		if (otherSDP.type === "offer") {
			// Answerer SDP created here
			let answer = await this.device.createAnswer();
			await this.device.setLocalDescription(answer);
		}
	}

	sendData(data) {
		this.dataChannel.send(JSON.stringify(data));
	}
}