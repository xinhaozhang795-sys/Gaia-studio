export interface GaiaPlugin {
  name: string;
  initialize?: () => void;
  update?: (delta: number) => void;
}

export class PluginManager {
  private plugins: GaiaPlugin[] = [];

  register(plugin: GaiaPlugin) {
    this.plugins.push(plugin);
    plugin.initialize?.();
  }

  update(delta: number) {
    this.plugins.forEach((plugin) => plugin.update?.(delta));
  }

  getPlugins() {
    return this.plugins;
  }
}

export const pluginManager = new PluginManager();
