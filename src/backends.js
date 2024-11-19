const backends = [
	{
		city: 'London (Linode)',
		desc: 'Linode in London',
		url: "https://explorer.jamulus.io/servers.php",
		warn: null
		//warn: 'NOTE: the London Linode server is currently having issues connecting to some directories.'
	},
	{
		city: 'London (AWS)',
		desc: 'AWS in London',
		url: "https://explorer.jamulus.io/servers-lon2.php",
		warn: null
	},
	{
		city: 'San Francisco',
		desc: 'DigitalOcean in San Francisco',
		url: "https://explorer.jamulus.io/servers-sf.php",
		warn: null
	}
];

export default backends
