class P2PDataChannel {
	constructor() {
		this.device = null;
		this.dataChannel = null;
		this.iceList = [];
		this.isInitiator = null;

		this.onSignalGenerated = (signal) => {};
		this.onDataReceived = (data) => {};
	}

	initialize() {
		if (this.device && this.device.connectionState !== "closed") {
			this.device.close();
		}

		this.device = new RTCPeerConnection({iceServers: [{urls: "stun:stun.l.google.com:19302"}]});
		this.iceList = [];

		this.device.onicecandidate = ({ candidate }) => {
			if (candidate != null) {
				this.iceList.push(candidate);
			} else {
				let input = JSON.stringify({
					sdp: this.device.localDescription,
					iceList: this.iceList
				}, null, 2);

				if (this.isInitiator) {
					input = document.URL + "#offer=" + encodeURIComponent(input);
				}
				
				this.onSignalGenerated(input);
			}
		};

		this.device.ondatachannel = (event) => {
			this.setupListeners(event.channel);
		};
	}

	setupListeners(dc) {
		this.dataChannel = dc;
		this.dataChannel.onmessage = (event) => this.onDataReceived(event.data);
	}

	async createOffer() {
		this.isInitiator = true;
		this.initialize(true);

		let dc = this.device.createDataChannel("dataChannel");
		this.setupListeners(dc);

		let offer = await this.device.createOffer();
		await this.device.setLocalDescription(offer);
	}

	async process(text) {
		document.getElementById("input").style.display = "none";
		document.getElementById("process").style.display = "none";
		
		let input = JSON.parse(text);
		let otherSDP = input.sdp;
		let otherIceList = input.iceCandidates || [];
		
		if (!this.device) {
			this.isInitiator = false;
			this.initialize();
		}
		
		await this.device.setRemoteDescription(new RTCSessionDescription(otherSDP));

		otherIceList.forEach(candidate => {
			this.device.addIceCandidate(new RTCIceCandidate(candidate))
		});

		if (otherSDP.type === "offer") {
			let answer = await this.device.createAnswer();
			await this.device.setLocalDescription(answer);
		}
	}

	sendData(data) {
		if (this.dataChannel && this.dataChannel.readyState === "open") {
			this.dataChannel.send(JSON.stringify(data));
		}
	}
}