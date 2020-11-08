<template>
	<div id="app">
		<h1>Jamulus Explorer</h1>
		<p class="options" v-if="!fixedServer">
			<select v-model="server" @change="setServer">
				<option value="" selected>Select server...</option>
				<optgroup v-if="options.central.length" label="Public central servers">
				<option v-for="(c, index) in options.central" :value="c.server" :key="index">{{ c.desc }}</option>
				</optgroup>
				<optgroup v-if="options.extra.length" label="Custom central servers">
				<option v-for="(c, index) in options.extra" :value="c.server" :key="index">{{ c.desc }}</option>
				</optgroup>
				<optgroup v-if="options.single.length" label="Custom single servers">
				<option v-for="(c, index) in options.single" :value="'='+c.server" :key="index">{{ c.desc }}</option>
				</optgroup>
			</select>

			<button @click="editList">Edit server list</button>

			<label>Auto-refresh:<input type="checkbox" value="1" v-model="refresh" @change="newRefresh"></label> (every 10-15 sec)
			<label>Hide empty servers:<input type="checkbox" value="1" v-model="hideempty"></label>
		</p>
			<div v-if="loading">Loading...</div>
			<div v-if="errored">Error fetching from {{chosenServer}}</div>
			<div v-if="chosenServer && !loading && (!servers || !servers.length)">No data from {{chosenServer}}</div>
		<table v-if="servers && servers.length" class="servers">
			<thead>
				<tr>
					<td colspan=8 class="left"><ul>
							<li>{{ chosenType == 'central' ? 'Central' : 'Single' }} server address: <strong>{{ chosenServer }}</strong></li>
							<li>The ping time shown is from this site's server at Linode in London.</li>
							<li>Click on a column heading to sort by that column.</li>
						</ul>
					</td>
					<td colspan=2>{{ servers.length }} {{ servertxt }}.<br>Last updated:<br>{{ lastFetch }}</td>
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
				<template v-for="(s, index) in sortedServers">
				<tr :key="'a'+s.index" :class="{perm: s.perm, even: !(index % 2), odd: index % 2}">
					<td class="num right">{{ s.index }}</td>
					<td class="name left">{{ s.name }}</td>
					<td class="city left">{{ s.city }}</td>
					<td class="country left">{{ s.country }}</td>
					<td class="maxclients nowrap">{{ s.nclients || 0 }}{{ s.maxclients ? ' / ' + s.maxclients : '' }}</td>
					<td class="ping right">{{ s.ping >= 0 ? s.ping : '' }}</td>
					<td class="ip left">{{ s.ip }}</td>
					<td class="port right">{{ s.port2 ? '('+s.port2+') '+s.port : s.port }}</td>
					<td class="version left">{{ s.version }}</td>
					<td class="os left">{{ s.os }}</td>
				</tr>
				<tr :key="'b'+s.index" v-if="s.clients && s.clients.length" :class="{even: !(index % 2), odd: index % 2}">
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
				<tr :key="'c'+s.index" v-if="s.clients && s.clients.length">
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
		<div class="copyright">&copy; 2020 <a href="https://tony.mountifield.org">Tony Mountifield</a> :: Code for this site on Github: <a href="https://github.com/softins/jamulus-web">jamulus-web</a> and <a href="https://github.com/softins/jamulus-php">jamulus-php</a></div>
	</div>
</template>

<script>
// import servers from './sample.js'

import options from './servers.js';

export default {
	name: 'App',
	data() {
		return {
			options: options,
			servers: [],
			server: '',
			queriedServer: '',
			fixedServer: false,
			errored: false,
			loading: false,
			fetched: null,
			timer: null,
			uparrow: "\u25b2",
			dnarrow: "\u25bc",
			sortup: 1,
			sortby: null,
			refresh: false,
			hideempty: false
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
		if (this.fixedServer) {
			this.setServer();
		}
	},
	computed: {
		chosenServer() {
			return this.server[0] == '=' ? this.server.substring(1) : this.server;
		},
		chosenType() {
			return this.server[0] == '=' ? 'server' : 'central';
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
		newRefresh() {
			if (this.refresh) {
				if (!this.timer) {
					this.timer = setTimeout(this.refreshServer, 1);
				}
			} else if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
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
			if (this.timer) {
				clearTimeout(this.timer);
				this.timer = null;
			}
			console.log('setServer: server changed to ' + this.chosenServer);
			this.servers = [];
			this.errored = false;
			if (this.chosenServer != '') {
				//this.servers = servers;
				this.queriedServer = this.chosenServer
				this.loading = true
				this.$http
					.get('http://jamulus.softins.co.uk/servers.php?' + this.chosenType + '=' + this.chosenServer)
					.then(response => {
						if (this.queriedServer != this.chosenServer) return;
						this.fetched = new Date()
						this.servers = response.data
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
			this.timer = null;
			this.errored = false;
			if (this.chosenServer != '') {
				this.queriedServer = this.chosenServer
				this.$http
					.get('http://jamulus.softins.co.uk/servers.php?' + this.chosenType + '=' + this.chosenServer)
					.then(response => {
						if (this.queriedServer != this.chosenServer) return;
						this.fetched = new Date()
						this.servers = response.data
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
		editList() {
			//alert("Edit list");
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
.left {
	text-align: left;
}

.right {
	text-align: right;
}

.nowrap {
	white-space: nowrap;
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
	background-color: #999977;
}
.servers tr.even td {
	background-color: #eeeedd;
}
.servers tr.odd td {
	background-color: #ddddcc;
}
.perm td {
	font-weight: bold;
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
.copyright {
  border-top: 1px lightgrey solid;
  margin-top: 3em;
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
</style>
