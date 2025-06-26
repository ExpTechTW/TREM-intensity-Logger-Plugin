const config = require("../config/config");

class Plugin {
	static instance = null;

	#ctx;
	#config;

	constructor(ctx) {
		if (Plugin.instance) return Plugin.instance;

		this.#ctx = ctx;
		this.#config = null;
		this.config = {};
		this.logger = null;

		Plugin.instance = this;
	}

	static getInstance() {
		if (!Plugin.instance) throw new Error("Plugin not initialized");

		return Plugin.instance;
	}

	runIntensityLogger(TREM, utils, args_info_path, ans) {
		const list = utils.fs.readdirSync(args_info_path);
		if (this.config.maximum_storage_day != 0) {
			for (let i = 0; i < list.length; i++) {
				const date = utils.fs.statSync(`${args_info_path}/${list[i]}`);
				if (Date.now() - date.ctimeMs > 86400 * this.config.maximum_storage_day * 1000) utils.fs.unlinkSync(`${args_info_path}/${list[i]}`);
			}
		}

		if (TREM.variable.play_mode == 2 || TREM.variable.play_mode == 3) return;
		utils.fs.writeFileSync(`${args_info_path}/${Date.now()}.json`, JSON.stringify(ans.data));
	}

	onLoad() {
		const { TREM, info, logger, utils } = this.#ctx;

		const defaultDir = utils.path.join(info.pluginDir, "./intensity-logger/resource/default.yml");
		const configDir = utils.path.join(info.pluginDir, "./intensity-logger/config.yml");

		this.logger = logger;
		this.#config = new config("intensity-logger", this.logger, utils.fs, defaultDir, configDir);
		this.config = this.#config.getConfig();

		const args_info_path = utils.path.join(info.pluginDir, "../logger/intensity");

		if (!utils.fs.existsSync(args_info_path)) utils.fs.mkdirSync(args_info_path);

		const event = (event, callback) => TREM.variable.events.on(event, callback);

		event("IntensityRelease", (ans) => this.runIntensityLogger(TREM, utils, args_info_path, ans));
		event("IntensityUpdate", (ans) => this.runIntensityLogger(TREM, utils, args_info_path, ans));
		event("IntensityEnd", (ans) => this.runIntensityLogger(TREM, utils, args_info_path, ans));
	}
  }

  module.exports = Plugin;
