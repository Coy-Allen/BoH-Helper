export const securityArgs = [
	"--allow-write=./config.json,./history.txt",
	"--allow-read",
	"--allow-sys=homedir",
	"--allow-env=TERM,COLORTERM,TERM_PROGRAM",
	"--deny-net",
	"--deny-env=SSH_CONNECTION",
];
