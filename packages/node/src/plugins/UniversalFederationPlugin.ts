import StreamingTargetPlugin from './StreamingTargetPlugin';
import NodeFederationPlugin from './NodeFederationPlugin';
import { ModuleFederationPluginOptions } from '../types';
import type { Compiler, container } from 'webpack';

interface NodeFederationOptions extends ModuleFederationPluginOptions {
  isServer: boolean;
  promiseBaseURI?: string;
  debug?: boolean;
}

interface NodeFederationContext {
  ModuleFederationPlugin?: typeof container.ModuleFederationPlugin;
}

class UniversalFederationPlugin {
  private _options: NodeFederationOptions;
  private context: NodeFederationContext;

  constructor(options: NodeFederationOptions, context: NodeFederationContext) {
    this._options = options || ({} as NodeFederationOptions);
    this.context = context || ({} as NodeFederationContext);
  }

  apply(compiler: Compiler) {
    const { isServer, debug, ...options } = this._options;
    const { webpack } = compiler;

    if (isServer || compiler.options.name === 'server' || compiler.options.target === 'node') {
      new NodeFederationPlugin(options, this.context).apply(compiler);
      new StreamingTargetPlugin({ ...options, debug }).apply(compiler);
    } else {
      new (this.context.ModuleFederationPlugin ||
        (webpack && webpack.container.ModuleFederationPlugin) ||
        require('webpack/lib/container/ModuleFederationPlugin'))(options).apply(
        compiler
      );
    }
  }
}

export default UniversalFederationPlugin;
