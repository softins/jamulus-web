<template>
	<h1>Jamulus Explorer</h1>
	<p class="options" v-if="!fixedServer">
		<select v-model="usebackend" @change="setServer">
			<option v-for="(b, index) in backends" :value="index" :key="index">{{ b.city }}</option>
		</select>
		&nbsp;
		<select v-model="server" @change="setServer">
			<option value="" selected>Select server...</option>
			<optgroup v-if="options.directory.length" label="Public directory servers">
			<option v-for="(c, index) in options.directory" :value="c.server" :key="index">{{ c.desc }}</option>
			</optgroup>
			<optgroup v-if="options.extra.length" label="Custom directory servers">
			<option v-for="(c, index) in options.extra" :value="c.server" :key="index">{{ c.desc }}</option>
			</optgroup>
			<optgroup v-if="options.single.length" label="Custom single servers">
			<option v-for="(c, index) in options.single" :value="'='+c.server+'='+c.desc" :key="index">{{ c.desc }}</option>
			</optgroup>
		</select>

		<button @click="editList = true">Edit server list</button>

		<label>Auto-refresh:<input type="checkbox" value="1" v-model="refresh" @change="newRefresh"></label> (every 10-15 sec)
		<label>Hide empty servers:<input type="checkbox" value="1" v-model="hideempty" @change="newHideEmpty"></label>
	</p>
	<div class="backendwarn" v-if="backendWarn">{{ backendWarn }}</div>
	<div v-if="loading">Loading...</div>
	<div v-if="errored">Error fetching from {{chosenServer}} ({{ errorMsg }})</div>
	<div v-if="chosenServer && !loading && !errored && (!servers || !servers.length)">No data from {{chosenServer}}</div>
	<table v-if="servers && servers.length" class="servers">
		<thead>
			<tr>
				<td colspan=8 class="left"><ul>
						<li>{{ chosenType == 'directory' ? 'Directory' : 'Single' }} server address: <strong>{{ chosenServer }}</strong></li>
						<li>The ping time shown is from this site's server at {{ backendDesc }}.</li>
						<li>Click on a column heading to sort by that column.</li>
						<li>Click on a server name to see the Welcome Message (if any). Not available if server is full.</li>
					</ul>
				</td>
				<td colspan=2><template v-if="hideempty">{{ sortedServers.length }} of </template>{{ servers.length }} {{ servertxt }}.<br>Last updated:<br>{{ lastFetch }}</td>
			</tr>
			<tr>
				<th class="click num right" @click="sortBy('index')"># {{ sortby=='index' ? arrow : '' }}</th>
				<th class="click name left" @click="sortBy('name')">Name {{ sortby=='name' ? arrow : '' }}</th>
				<th class="click city left" @click="sortBy('city')">City {{ sortby=='city' ? arrow : '' }}</th>
				<th class="click country left" @click="sortBy('country')">Country {{ sortby=='country' ? arrow : '' }}</th>
				<th class="click maxclients" @click="sortBy('maxclients')">Clients {{ sortby=='maxclients' ? arrow : '' }}</th>
				<th class="click ping right" @click="sortBy('ping')">Ping (ms) {{ sortby=='ping' ? arrow : '' }}</th>
				<th class="click ip left" @click="sortBy('numip')">IP {{ sortby=='numip' ? arrow : '' }}</th>
				<th class="click port right" @click="sortBy('port')">Port {{ sortby=='port' ? arrow : '' }}</th>
				<th class="click version left" @click="sortBy('versionsort')">Version {{ sortby=='versionsort' ? arrow : '' }}</th>
				<th class="click os left" @click="sortBy('os')">OS {{ sortby=='os' ? arrow : '' }}</th>
			</tr>
		</thead>
		<tbody>
			<template v-for="(s, index) in sortedServers" :key="s.index">
			<tr :class="{perm: s.perm, even: !(index % 2), odd: index % 2}">
				<td class="num right">{{ s.index }}</td>
				<td v-if="s.nclients && s.nclients >= s.maxclients" class="name left nolink">{{ s.name }}</td>
				<td v-else class="name left link" @click="fetchWelcome(s)">{{ s.name }}</td>
				<td class="city left">{{ s.city }}</td>
				<td class="country left">{{ s.country }}</td>
				<td class="maxclients nowrap">{{ s.nclients || 0 }}{{ s.maxclients ? ' / ' + s.maxclients : '' }}</td>
				<td class="ping right">{{ s.ping >= 0 ? s.ping : '' }}</td>
				<td class="ip left">{{ s.ip }}</td>
				<td class="port right">{{ s.port2 ? '('+s.port2+') '+s.port : s.port }}</td>
				<td class="version left">{{ s.version }}</td>
				<td class="os left">{{ s.os }}</td>
			</tr>
			<tr v-if="s.clients && s.clients.length" :class="{even: !(index % 2), odd: index % 2}">
				<td colspan=10 class="clientlist">
					<table class="clients">
						<thead>
							<tr>
							<th class="chan right">Chan#</th>
							<th class="name left">Name</th>
							<th class="instrument left">Instrument</th>
							<th class="skill left">Skill</th>
							<th class="city left">City</th>
							<th class="country left">Country</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(c, index2) in s.clients" :key="index2" :class="{even: !(index2 % 2), odd: index2 % 2}">
							<td class="chan right">{{ c.chanid }}</td>
							<td class="name left">{{ c.name }}</td>
							<td class="instrument left">{{ c.instrument }}</td>
							<td class="skill left">{{ c.skill }}</td>
							<td class="city left">{{ c.city }}</td>
							<td class="country left">{{ c.country }}</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
			<tr v-if="s.clients && s.clients.length">
				<th class="num right">#</th>
				<th class="name left">Name</th>
				<th class="city left">City</th>
				<th class="country left">Country</th>
				<th class="maxclients">Clients</th>
				<th class="ping right">Ping (ms)</th>
				<th class="ip left">IP</th>
				<th class="port right">Port</th>
				<th class="version left">Version</th>
				<th class="os left">OS</th>
			</tr>
			</template>
		</tbody>
	</table>
	<p v-if="!loading && !errored && servers && servers.length && chosenType == 'server'">(It is not possible to fetch name, city, country and capacity from a single server)</p>
	<!-- <p class="worldjam">&#127926; To learn about performing on WorldJam using Jamulus, visit <a href="https://worldjam.vip">worldjam.vip</a> &#127926;</p> -->
	<div class="copyright">&copy; 2020-2025 <a href="https://tony.mountifield.org">Tony Mountifield</a>
		::
		Code for this site on Github: <a href="https://github.com/softins/jamulus-web">jamulus-web</a> and <a href="https://github.com/softins/jamulus-php">jamulus-php</a>
		::
		For more about online jamming with Jamulus, see <a href="https://jamulus.io">jamulus.io</a>
	</div>
	<modal-box :show="editList" @close="editList = false" @cancel="editList = false" :close="'Done'" :nofocus="true" :width="600">
	<template v-slot:header>
		<h3 id="editlist" >Edit server list</h3>
	</template>
	<p>This form allows custom directory servers or single servers to be added or removed. They will be remembered in the browser's local storage. If not specified, the port defaults to 22124.</p>
	<table width="100%">
		<tbody>
			<tr><td colspan=5><hr></td></tr>
			<tr><th colspan=5>Custom directory servers</th></tr>
			<tr v-for="(c, index) in options.extra" :key="'a'+index">
				<td>{{ c.desc }}</td>
				<td>{{ c.server }}</td>
				<td><button class="arrow" v-if="index < options.extra.length-1" @click="moveDown('directory', options.extra, index)">&darr;</button></td>
				<td><button class="arrow" v-if="index > 0" @click="moveUp('directory', options.extra, index)">&uarr;</button></td>
				<td><button @click="deleteServer('directory', options.extra, index)">Delete</button></td>
			</tr>
			<tr>
				<td><input type="text" placeholder="Description" v-model="custom.desc"></td>
				<td><input type="text" placeholder="Domain or IP" v-model="custom.name"></td>
				<td colspan=2><input type="text" size=3 maxLength=5 placeholder="Port" v-model="custom.port"></td>
				<td><button :disabled="custom.desc == '' || custom.name == ''" @click="addServer('directory', options.extra, custom)">Add</button></td>
			</tr>
			<tr><td colspan=5><hr></td></tr>
			<tr><th colspan=5>Custom single servers</th></tr>
			<tr v-for="(c, index) in options.single" :key="'b'+index">
				<td>{{ c.desc }}</td>
				<td>{{ c.server }}</td>
				<td><button class="arrow" v-if="index < options.single.length-1" @click="moveDown('server', options.single, index)">&darr;</button></td>
				<td><button class="arrow" v-if="index > 0" @click="moveUp('server', options.single, index)">&uarr;</button></td>
				<td><button @click="deleteServer('server', options.single, index)">Delete</button></td>
			</tr>
			<tr>
				<td><input type="text" placeholder="Description" v-model="single.desc"></td>
				<td><input type="text" placeholder="Domain or IP" v-model="single.name"></td>
				<td colspan=2><input type="text" size=3 maxLength=5 placeholder="Port" v-model="single.port"></td>
				<td><button :disabled="single.desc == '' || single.name == ''" @click="addServer('server', options.single, single)">Add</button></td>
			</tr>
			<tr><td colspan=5><hr></td></tr>
			<tr>
				<td colspan=5 class="centre">
					<button @click="saveTextToFile">Save to file</button>
					<label for="loadfile" class="loadfile">
						<button type="button" @click="clickParent">Load from file</button>
						<input type="file" accept="application/json" name="loadfile" id="loadfile" @change="loadTextFromFile" @click="resetFile">
					</label>
				</td>
			</tr>
			<tr><td colspan=5><hr></td></tr>
		</tbody>
	</table>
	</modal-box>
	<modal-box :show="showWelcome" @close="showWelcome = false" @cancel="showWelcome = false" :nofocus="true" :width="600">
	<template v-slot:header>
		<h3 id="showwelcome" >Welcome message for {{ welcomeSvr }}</h3>
	</template>
	<hr>
	<div><span v-html="welcomeMsg"></span></div>
	</modal-box>
</template>

<script>
// import servers from './sample.js'

import backends from './backends.js';
import options from './servers.js';
import ModalBox from './components/ModalBox.vue'
import { mixin as focusMixin } from './focus.js'

export default {
	name: 'App',
	mixins: [focusMixin],
	components: { ModalBox },
	data() {
		return {
			options: options,
			servers: [],
			server: '',
			fixedServer: false,
			errored: false,
			errorMsg: '',
			loading: false,
			fetched: null,
			timer: null,
			uparrow: "\u25b2",
			dnarrow: "\u25bc",
			sortup: 1,
			sortby: null,
			refresh: false,
			hideempty: false,
			editList: false,
			showWelcome: false,
			welcomeMsg: '',
			welcomeSvr: '',
			custom: {
				desc: '',
				name: '',
				port: ''
			},
			single: {
				desc: '',
				name: '',
				port: ''
			},
			backends: backends,
			usebackend: 0
		}
	},
	created() {
		var urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has('auto')) {
			this.refresh = true;
		}
		if (urlParams.has('hideempty')) {
			this.hideempty = true;
		}
		this.server = '';
		if (urlParams.has('directory')) {
			this.server = urlParams.get('directory');
			if (this.server) {
				this.fixedServer = true;
			}
		}
		if (urlParams.has('central')) {
			this.server = urlParams.get('central');
			if (this.server) {
				this.fixedServer = true;
			}
		}
		if (urlParams.has('server')) {
			this.server = urlParams.get('server');
			if (this.server) {
				this.server = '=' + this.server;
				this.fixedServer = true;
			}
		}
	},
	mounted() {
		this.usebackend = localStorage.getItem('backend') || 0;
		this.refresh = localStorage.getItem('refresh') == 'true';
		this.hideempty = localStorage.getItem('hideempty') == 'true';

		if (!this.fixedServer) {
			// temporary code because of name changes
			var s;
			if ((s = localStorage.getItem('central'))) {
				localStorage.removeItem('central');
				localStorage.setItem('directory', s);
			}
			if ((s = localStorage.getItem('extra'))) {
				localStorage.removeItem('extra');
				localStorage.setItem('directory', s);
			}
			if ((s = localStorage.getItem('single'))) {
				localStorage.removeItem('single');
				localStorage.setItem('server', s);
			}
			// end of temporary code
			this.options.extra = JSON.parse(localStorage.getItem('directory')) || [];
			this.options.single = JSON.parse(localStorage.getItem('server')) || [];

			this.server = localStorage.getItem('useserver') || '';
		}

		this.setServer();
	},
	computed: {
		backendDesc() {
			return this.backends[this.usebackend].desc;
		},
		backendURL() {
			return this.backends[this.usebackend].url;
		},
		backendWarn() {
			return this.backends[this.usebackend].warn;
		},
		chosenServer() {
			if (this.server[0] != '=') return this.server;
			let i = this.server.substring(1).indexOf('=');
			if (i < 0) return this.server.substring(1);
			return this.server.substring(1, 1+i);
		},
		chosenDesc() {
			if (this.server[0] != '=') return null;
			let i = this.server.substring(1).indexOf('=');
			if (i < 0) return null;
			return this.server.substring(2+i);
		},
		chosenType() {
			return this.server[0] == '=' ? 'server' : 'directory';
		},
		chosenURL() {
			let url = this.backendURL + '?' + this.chosenType + '=' + this.chosenServer;
			if (this.chosenDesc) {
				url += '&name=' + encodeURIComponent(this.chosenDesc);
			}
			return url;
		},
		servertxt() {
			return this.servers.length == 1 ? 'server' : 'servers';
		},
		arrow() {
			return this.sortup>0 ? this.uparrow : this.dnarrow;
		},
		lastFetch() {
			return this.fetched && this.fetched.toLocaleTimeString();
		},
		sortedServers() {
			var sortup = this.sortup;
			var sortby = this.sortby;
			if (!this.sortby && !this.hideempty) return this.servers;
			function compare(a,b) {
				switch (sortby) {
					case 'index':
						break;
					case 'name':
						if (a.name.toLowerCase()<b.name.toLowerCase()) return -sortup;
						if (a.name.toLowerCase()>b.name.toLowerCase()) return sortup;
						break;
					case 'country':
						if (a.country.toLowerCase()<b.country.toLowerCase()) return -sortup;
						if (a.country.toLowerCase()>b.country.toLowerCase()) return sortup;
						// fall through
					case 'city':
						if (a.city.toLowerCase()<b.city.toLowerCase()) return -sortup;
						if (a.city.toLowerCase()>b.city.toLowerCase()) return sortup;
						break;
					case 'ping':
						if (a[sortby]<0 && b[sortby]>=0) return 1;
						if (a[sortby]>=0 && b[sortby]<0) return -1;
						if (a[sortby]<b[sortby]) return -sortup;
						if (a[sortby]>b[sortby]) return sortup;
						break;
					default:
						if (a[sortby]=='' && b[sortby]!='') return 1;
						if (a[sortby]!='' && b[sortby]=='') return -1;
						if (a[sortby]<b[sortby]) return -sortup;
						if (a[sortby]>b[sortby]) return sortup;
						break;
				}
				return sortup * (a.index - b.index);
			}
			if (this.hideempty)
				return this.servers.filter(function(s) {return s.clients && s.clients.length;}).sort(compare);

			return this.servers.slice().sort(compare);
		}
	},
	methods: {
		fetchWelcome(s) {
			this.welcomeMsg = 'Loading...';
			this.welcomeSvr = s.name;
			this.showWelcome = true;
			this.$http
				.get(this.backendURL + '?query=' + s.ip + ':' + (s.port2 || s.port))
				.then(response => {
					console.log(s, response.data);
					if (response.data.error) {
						this.welcomeMsg = 'Error querying server';
					} else if (response.data.length && response.data[0].welcome) {
						this.welcomeMsg = this.$sanitize(response.data[0].welcome);
					} else {
						this.welcomeMsg = 'No welcome message';
						console.log(response.data);
					}
					console.log(s.name, this.welcomeMsg)
				})
				.catch(error => {
					console.log(s, error);
				})
				.finally(() => {});
		},
		newRefresh() {
			localStorage.setItem('refresh', this.refresh);

			if (this.refresh) {
				if (!this.timer) {
					this.timer = setTimeout(this.refreshServer, 1);
				}
			} else if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
		},
		newHideEmpty() {
			localStorage.setItem('hideempty', this.hideempty);
		},
		sortBy(key) {
			if (key === this.sortby) {
				this.sortup = -this.sortup;
				return;
			}
			this.sortup = 1;
			this.sortby = key;
		},
		setServer() {
			var queriedServer;
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}

			localStorage.setItem('useserver', this.server);
			localStorage.setItem('backend', this.usebackend);

			console.log('setServer: server changed to ' + this.chosenServer);
			this.servers = [];
			this.errored = false;
			if (this.chosenServer != '') {
				//this.servers = servers;
				queriedServer = this.chosenServer
				this.loading = true
				this.$http
					.get(this.chosenURL)
					.then(response => {
						if (queriedServer == this.chosenServer) {
							this.fetched = new Date()
							if (response.data.error) {
								this.errored = true;
								this.errorMsg = response.data.error;
								this.servers = [];
							} else {
								this.servers = response.data
							}
						}
						//var self = this;
						//this.timer = setTimeout(self.refreshServer, 10000);
						if (this.refresh) this.timer = setTimeout(this.refreshServer, 10000);
					})
					.catch(error => {
						console.log(error)
						this.errored = true
					})
					.finally(() => this.loading = false)
			}
		},
		refreshServer() {
			var queriedServer;
			this.timer = null;
			this.errored = false;
			if (this.chosenServer != '') {
				queriedServer = this.chosenServer
				this.$http
					.get(this.chosenURL)
					.then(response => {
						if (queriedServer == this.chosenServer) {
							this.fetched = new Date()
							if (response.data.error) {
								this.errored = true;
								this.errorMsg = response.data.error;
								this.servers = [];
							} else {
								this.servers = response.data
							}
						}
						//var self = this;
						//this.timer = setTimeout(self.refreshServer, 10000);
						if (this.refresh) this.timer = setTimeout(this.refreshServer, 10000);
					})
					.catch(error => {
						console.log(error)
						this.errored = true
					})
					.finally(() => this.loading = false)
			}
		},
		moveUp(kind, list, index) {
			if (index == 0) return;
			var tmp = list[index-1];
			list[index-1] = list[index];
			list[index] = tmp;
			localStorage.setItem(kind, JSON.stringify(list));
			this.$forceUpdate();
		},
		moveDown(kind, list, index) {
			if (index+1 >= list.length) return;
			var tmp = list[index+1];
			list[index+1] = list[index];
			list[index] = tmp;
			localStorage.setItem(kind, JSON.stringify(list));
			this.$forceUpdate();
		},
		addServer(kind, list, detail) {
			if (detail.desc == '' || detail.name == '') return;
			//console.log({list, detail});
			list.push({ desc: detail.desc, server: detail.name + ':' + (detail.port || 22124)});
			detail.desc = '';
			detail.name = '';
			detail.port = '';
			localStorage.setItem(kind, JSON.stringify(list));
		},
		deleteServer(kind, list, index) {
			console.log({curtype: this.chosenType, cursrv: this.chosenServer, kind, list, index});
			if (kind == this.chosenType && list[index].server == this.chosenServer) {
				this.server = '';
				this.setServer();
			}
			list.splice(index,1);
			localStorage.setItem(kind, JSON.stringify(list));
		},
		saveTextToFile() {
			var data = {
				directory: this.options.extra,
				single: this.options.single
			}
			var file = new Blob([JSON.stringify(data)], {type: 'application/json;charset=utf-8'});

			var anchor = document.createElement('a');
			anchor.href = URL.createObjectURL(file);
			anchor.download = 'explorer.json';
			anchor.click();
			URL.revokeObjectURL(anchor.href);
		},
		resetFile(e) {
			e.target.value = '';
		},
		loadTextFromFile(e) {
			var f = e.target.files;
			var reader = new FileReader();
			var options = this.options;

			reader.onloadend = function() {
				var data = JSON.parse(reader.result);
				if (data.directory) {
					options.extra = data.directory;
					localStorage.setItem('directory', JSON.stringify(options.extra));
				}
				if (data.single) {
					options.single = data.single;
					localStorage.setItem('server', JSON.stringify(options.single));
				}
			}
			reader.readAsText(f[0]);
		},
		clickParent(e) {
			e.target.parentNode.click();
		}
	}
}
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	font-size: 80%;
	text-align: center;
	color: #2c3e50;
	margin-top: 10px;
}

.click {
	cursor: pointer;
}

.centre {
	text-align: center;
}

.left {
	text-align: left;
}

.right {
	text-align: right;
}

.nolink {
	cursor: not-allowed;
}

.link {
	cursor: pointer;
}
.link:hover {
	text-decoration: underline;
}

.nowrap {
	white-space: nowrap;
}

.new {
	color: white;
	background-color: red;
	padding: 0 5px;
	border-radius: 0.5em;
	font-weight: bold;
}

.servers {
	margin: 0 auto;
}
.servers, .servers tr, .servers tr th, .servers tr td {
	border: 1px solid lightgrey;
	border-collapse: collapse;
}

.servers tr th, .servers tr td {
	padding: .3em;
}
.servers tr th {
	background-color: #88aacc;
}
.servers tr.even td {
	background-color: #ddeeff;
}
.servers tr.odd td {
	background-color: #ccddee;
}
.perm td {
	font-weight: bold;
}
.backendwarn {
	font-weight: bold;
	color: #ee0000;
	margin-bottom: 1em;
}
/*
.clientlist {
	background-color: #ffee99;
}
*/
.clients {
	margin: 0 auto;
	width: 100%;
	background-color: #ffffff;
	font-size: 90%;
}
.clients, .clients tr, .clients th, .clients td {
	border: 1px dotted lightgrey;
	border-collapse: collapse;
}

.clients tr th, .clients tr td {
	padding: 0.2em 1em;
	background-color: #dddddd;
}
.clients th {
	background-color: #cccccc;
}
.clients tr.even td {
	background-color: #f8f8f8;
}
.clients tr.odd td {
	background-color: #eeeeee;
}

ul {
	margin:0;
}
label {
	margin-left: 3em;
}
button {
	margin-left: 1em;
}
button.arrow {
	margin: 0;
	font-weight: bold;
}
.worldjam {
	font-size: 85%;
	font-weight: bold;
	color: #0000cc;
	padding: 2px;
  margin: 2em auto 0 auto;
}
.copyright {
  border-top: 1px lightgrey solid;
  margin-top: 1em;
  padding-top: 1em;
  font-size: 80%;
  color: grey;
}

.copyright a {
	text-decoration: none;
}

.copyright a:hover {
	text-decoration: underline;
}

label.loadfile input {
	opacity: 0;
	width: 0.1px;
	height: 0.1px;
	position: absolute;
}
</style>
