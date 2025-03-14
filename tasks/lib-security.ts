export const securityArgs = [
	"--allow-write=./config.json,./history.txt",
	"--allow-read",
	"--allow-sys=homedir",
	"--allow-env="+
		"TERM,COLORTERM,TERM_PROGRAM,"+
		"VTE_VERSION", // Linux only
	// linux/mac grabs ALL env vars to check for *KONSOLE* env var. IDK how to allow that. for now just deny it.
	"--deny-env",
	// checks for SSH terminal information. should be fine but I don't like it being allowed.
	// "--deny-env=SSH_CONNECTION",
	"--deny-net",
];
