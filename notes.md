
Notes all in one place. bugs and 

# functions to review
	- maxAspects
		- looks fine
		- BUG: terminal-kit library's table function causes truecolor to not render.
	- maxAspectsPreset
		- looks fine
		- TODO: get more presets. prioritize assistances.
	- searchVerbs
		- TODO
	- searchItems
		- looks good. see the output/ui section for more info on improvements.
	- searchItemPresets
		- TODO
	- searchRecipes
		- TODO
		- FIXME: does not include multi-step recipes.
	- missingCraftable
		- TODO
		- FIXME: does not include multi-step recipes.
		- FIXME: does not include garden \w respect to season
	- availableMemories
		- TODO
	- listAspects
		- kinda messy but it works.

# output/ui
	- misc
		- make more output types.
	- item output
		- need more output options.
		- review color output

# recipes
	- BUGS:
		- does not check if the recipe's skill is actually owned.

# misc
	- BUG: save/load
		- game saves the file in multiple passes. might need some sort of timer system. ex: on file update, defer for 5 seconds. restart timer if called again. after timer ends, then load file and process.
		- file watcher can load file in the middle of a command being ran. instead of loading instantly, set a flag to load the file before the next command is processed.