
//--------------
//
//  Dependencies
//
//--------------

const fs = require("fs")
const prompts = require('prompts');
const config = require("../../core/config");

//--------------
//
//  Command Definition
//
//--------------

module.exports = {
	
	desc: "Given the specification file path, suggest changes to be made",
	
	setup: (cmd) => {
		// No additional argument required
	},
	
	// Execute the run command
	run: async (argv, context) => {
		// Check if there is package.json in the CWD
		// if it exists lets read it for default values
		// else default to null
		let packageJson = null;
		try {
			packageJson = require(process.cwd()+"/package.json");
		} catch(err) {
			// Ignore error
		}

		// Log that the package.json was found
		if(packageJson) {
			console.log("Found package.json, using it for default values");
		}

		// Lets extract the existing description
		let initDescript = null;
		if( config.config?.short_description ) {
			initDescript = config.config.short_description;
		} else if( packageJson?.description ) {
			initDescript = packageJson.description;
		}

		// Lets ask the user for the following key values
		// - openAI API key
		// - description of the project
		// - spec_dir (if enabled)

		// Ask for the openAI API key
		let promptConfig = await prompts([
			{
				type: 'password',
				name: 'openai_key',
				message: 'OpenAI API Key (leave blank to use existing, if any)',
			},
			{
				type: 'text',
				name: 'short_description',
				message: 'Short Description of the project',
				initial: initDescript
			},
			{
				type: 'text',
				name: 'spec_dir',
				message: 'Does this project have a markdown specification directory? Leave blank if disabled',
				initial: (config.config?.spec_dir === null)? "spec" : config.config?.spec_dir,
			},
			{
				type: 'text',
				name: 'src_dir',
				message: 'Where would be the src code dir be (which the AI can modify)? Leave blank to use the entire project directory',
				initial: (config.config?.src_dir === null)? "src" : config.config?.src_dir,
			}
		], {
			onCancel: () => {
				console.log("Exit command recieved, exiting...");
				process.exit(1);
			}
		});
		
		// Lets get the updated config values
		let aibridgeConfig = Object.assign({}, config.aibridge);
		aibridgeConfig.provider.openai = promptConfig.openai_key || aibridgeConfig.provider.openai;

		// Lets get the updated config values
		let configValues = Object.assign({}, config.config);
		configValues.short_description = promptConfig.short_description || configValues.short_description;
		configValues.spec_dir = promptConfig.spec_dir || configValues.spec_dir;
		configValues.src_dir = promptConfig.src_dir || configValues.src_dir;

		// Lets setup the src include / exclude
		configValues.src_include = configValues.src_include || ["**"];
		configValues.src_exclude = configValues.src_exclude || ["**/.*", "**/*.bin", "**/node_modules/**", "**/build/**", "**/bin/**"]

		// Lets write the config file
		await fs.promises.writeFile(process.cwd()+"/.my-ai-dev/config/aibridge.json", JSON.stringify( aibridgeConfig, null, "	" ));
		await fs.promises.writeFile(process.cwd()+"/.my-ai-dev/config/config.json", JSON.stringify( configValues, null, "	" ));
	}
}