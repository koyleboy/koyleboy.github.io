async function e(e) {
	let t = e.sampleRate ?? 48e3, n = e.numChannels ?? 2, i = e.decayTime * 1.5, o = Math.round(e.decayTime * t), s = Math.round(i * t), c = Math.round((e.fadeInTime ?? 0) * t), l = (1 / 1e3) ** (1 / o), u = new AudioBuffer({
		numberOfChannels: n,
		length: s,
		sampleRate: t
	});
	for (let e = 0; e < n; e++) {
		let t = u.getChannelData(e);
		for (let e = 0; e < s; e++) t[e] = a() * l ** +e;
		for (let e = 0; e < c; e++) t[e] *= e / c;
	}
	return r(u, e.lpFreqStart ?? 0, e.lpFreqEnd ?? 0, e.decayTime);
}
function t(e, t, n, r, i) {
	let a = document.createElement("canvas");
	a.width = t, a.height = n;
	let o = a.getContext("2d");
	o.fillStyle = "#000", o.fillRect(0, 0, a.width, a.height), o.fillStyle = "#fff";
	let s = t / e.length, c = n / (i - r);
	for (let t = 0; t < e.length; t++) o.fillRect(t * s, n - (e[t] - r) * c, 1, 1);
	return a;
}
function n(e, t, n = 0) {
	let r = e.sampleRate, a = e.numberOfChannels, o = i(e), s = o[0].length, c = 32767, l = 0;
	for (let e = 0; e < a; e++) for (let t = 0; t < s; t++) l = Math.max(l, Math.abs(o[e][t]));
	if (l && (c = 32767 / l), n) {
		let e = 0;
		for (let t = 0; t < a; t++) for (let r = 0; r < s; r++) Math.abs(Math.round(c * o[t][r])) > n && (e = r);
		s = e + 1;
	}
	let u = a * 2, d = u * s, f = d + 44, p = new ArrayBuffer(f), m = new DataView(p);
	m.setUint32(0, 1179011410, !0), m.setUint32(4, f - 8, !0), m.setUint32(8, 1163280727, !0), m.setUint32(12, 544501094, !0), m.setUint32(16, 16, !0), m.setUint16(20, 1, !0), m.setUint16(22, a, !0), m.setUint32(24, r, !0), m.setUint32(28, r * u, !0), m.setUint16(32, u, !0), m.setUint16(34, 16, !0), m.setUint32(36, 1635017060, !0), m.setUint32(40, d, !0);
	for (let e = 0; e < s; e++) for (let t = 0; t < a; t++) m.setInt16(44 + e * u + t * 2, Math.round(c * o[t][e]), !0);
	let h = new Blob([p], { type: "audio/wav" }), g = URL.createObjectURL(h), _ = document.createElement("a");
	_.href = g, _.download = t, _.style.display = "none", document.body.appendChild(_), _.click(), document.body.removeChild(_), URL.revokeObjectURL(g);
}
async function r(e, t, n, r) {
	if (t === 0) return e;
	let i = new OfflineAudioContext(e.numberOfChannels, e.length, e.sampleRate), a = i.createBufferSource();
	a.buffer = e;
	let o = i.createBiquadFilter();
	return t = Math.min(t, e.sampleRate / 2), n = Math.min(n, e.sampleRate / 2), o.type = "lowpass", o.Q.value = 1e-4, o.frequency.setValueAtTime(t, 0), o.frequency.linearRampToValueAtTime(n, r), a.connect(o), o.connect(i.destination), a.start(), i.startRendering();
}
function i(e) {
	let t = [];
	for (let n = 0; n < e.numberOfChannels; n++) t[n] = e.getChannelData(n);
	return t;
}
function a() {
	return Math.random() * 2 - 1;
}
//#endregion
window.generateReverb = e, window.visualizeBuffer = t, window.downloadBufferAsWav = n;
