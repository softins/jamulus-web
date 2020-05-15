<template>
	<div id="app">
		<h1>Jamulus Explorer</h1>
		<p class="options">
			<select v-model="centralServer" @change="setServer">
				<option value="" selected>Select default server</option>
				<option value="jamulus.fischvolk.de:22124">Default server</option>
				<option value="jamulus.fischvolk.de:22224">Default server (North America)</option>
				<option value="worldjam.vip:22124">Worldjam server</option>
			</select>

			<label>Auto-refresh:<input type="checkbox" value="1" v-model="refresh" @change="newRefresh"></label> (every 10-15 sec)
		</p>
			<div v-if="loading">Loading...</div>
			<div v-if="errored">Error fetching from {{centralServer}}</div>
			<div v-if="centralServer && !loading && (!servers || !servers.length)">No data from {{centralServer}}</div>
		<table v-if="servers && servers.length" class="servers">
			<thead>
				<tr>
					<td colspan=8 class="left"><ul>
							<li>If NAT is shown, it is likely to be a server on someone's personal LAN</li>
							<li>The ping time shown is from this site's server at Linode in London.</li>
							<li>Click on a column heading to sort by that column.</li>
						</ul>
					</td>
					<td colspan=2>{{ servers.length }} servers.<br>Last updated:<br>{{ lastFetch }}</td>
				</tr>
				<tr>
					<th class="click num right" @click="sortBy('index')"># {{ sortby=='index' ? arrow : '' }}</th>
					<th class="click name left" @click="sortBy('name')">Name {{ sortby=='name' ? arrow : '' }}</th>
					<th class="click city left" @click="sortBy('city')">City {{ sortby=='city' ? arrow : '' }}</th>
					<th class="click country left" @click="sortBy('country')">Country {{ sortby=='country' ? arrow : '' }}</th>
					<th class="click ping right" @click="sortBy('ping')">Ping (ms) {{ sortby=='ping' ? arrow : '' }}</th>
					<th class="click ip left" @click="sortBy('numip')">IP {{ sortby=='numip' ? arrow : '' }}</th>
					<th class="click port right" @click="sortBy('port')">Port {{ sortby=='port' ? arrow : '' }}</th>
					<th class="click nat left" @click="sortBy('NAT')">NAT {{ sortby=='NAT' ? arrow : '' }}</th>
					<th class="click version left" @click="sortBy('version')">Version {{ sortby=='version' ? arrow : '' }}</th>
					<th class="click os left" @click="sortBy('os')">OS {{ sortby=='os' ? arrow : '' }}</th>
				</tr>
			</thead>
			<tbody>
				<template v-for="(s, index) in sortedServers">
				<tr :key="'a'+s.index" :class="{nat: s.NAT, perm: s.perm, even: !(index % 2), odd: index % 2}">
					<td class="num right">{{ s.index }}</td>
					<td class="name left">{{ s.name }}</td>
					<td class="city left">{{ s.city }}</td>
					<td class="country left">{{ s.country }}</td>
					<td class="ping right">{{ s.ping >= 0 ? s.ping : '' }}</td>
					<td class="ip left">{{ s.ip }}</td>
					<td class="port right">{{ s.port }}</td>
					<td class="nat left"><span v-if="s.NAT">NAT</span></td>
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
								<th class="ip left">IP</th>
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
								<td class="ip left">{{ c.ip }}</td>
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
					<th class="ping right">Ping (ms)</th>
					<th class="ip left">IP</th>
					<th class="port right">Port</th>
					<th class="nat left">NAT</th>
					<th class="version left">Version</th>
					<th class="os left">OS</th>
				</tr>
				</template>
			</tbody>
		</table>
	</div>
</template>

<script>
// import servers from './sample.js'

export default {
	name: 'App',
	data() {
		return {
			servers: [],
			centralServer: '',
			errored: false,
			loading: false,
			fetched: null,
			timer: null,
			uparrow: "\u25b2",
			dnarrow: "\u25bc",
			sortup: 1,
			sortby: null,
			refresh: false
		}
	},
	computed: {
		arrow() {
			return this.sortup>0 ? this.uparrow : this.dnarrow;
		},
		lastFetch() {
			return this.fetched && this.fetched.toLocaleTimeString();
		},
		sortedServers() {
			var sortup = this.sortup;
			var sortby = this.sortby;
			if (!this.sortby) return this.servers;
			function compare(a,b) {
				switch (sortby) {
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
					case 'index':
						break;
					default:
						if (a[sortby]<b[sortby]) return -sortup;
						if (a[sortby]>b[sortby]) return sortup;
						break;
				}
				return sortup * (a.index - b.index);
			}
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
			console.log('setServer: centralServer changed to ' + this.centralServer);
			this.servers = [];
			if (this.centralServer != '') {
				//this.servers = servers;
				this.loading = true
				this.errored = false
				this.$http
					.get('http://jamulus.softins.co.uk/servers.php?central=' + this.centralServer)
					.then(response => {
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
			if (this.centralServer != '') {
				this.errored = false
				this.$http
					.get('http://jamulus.softins.co.uk/servers.php?central=' + this.centralServer)
					.then(response => {
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
	margin-top: 60px;
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
</style>
