import {
  WebpackRemoteScriptFactory,
  WebpackSharingScopeFactory,
} from '../integrations/webpack';
import { getContainerKey, initContainer } from '../lib';
import { getScope } from '../lib/scopes';
import type {
  GetModuleOptions,
  GetModulesOptions,
  RemoteContainer,
  RemoteOptions,
} from '../types';

/**
 * Return initialized remote container
 *
 * @returns remote container
 */
export async function loadAndInitializeRemote(remoteOptions: RemoteOptions): Promise<RemoteContainer> {
  const globalScope = getScope();
  const containerKey = getContainerKey(remoteOptions);

  // TODO: Make this generic, possibly the runtime?
  const asyncContainer = new WebpackRemoteScriptFactory().loadScript(
    containerKey,
    remoteOptions
  );

  if (!asyncContainer) {
    throw new Error('Unable to load remote container');
  }

  // TODO: look at init tokens, pass to getSharingScope

  if (!globalScope.__sharing_scope__) {
    // TODO: Make this generic, possibly the runtime?
    globalScope.__sharing_scope__ =
      await new WebpackSharingScopeFactory().initializeSharingScope();
  }

  return initContainer(asyncContainer, globalScope.__sharing_scope__);
};

/**
 * Return remote module from container.
 * If you provide `exportName` it automatically return exact property value from module.
 * @param param0
 * @returns
 */
export const getModule = async <T>({
  remoteContainer,
  modulePath,
  exportName,
}: GetModuleOptions): Promise<T | undefined> => {
  if (!remoteContainer) return undefined;

  try {
    const modFactory = await remoteContainer?.get(modulePath);
    if (!modFactory) return undefined;
    const mod = modFactory() as Record<string, T>;
    if (exportName) {
      return mod && typeof mod === 'object'
        ? (mod[exportName] as T)
        : undefined;
    } else {
      return mod as T;
    }
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

/**
 * Return remote modules from container (assumes default exports).
 * @param param0
 * @returns
 */
export const getModules = async ({
  remoteContainer,
  modulePaths,
}: GetModulesOptions) => {
  if (!remoteContainer) return undefined;

  try {
    const moduleFactories = await Promise.all(
      modulePaths.map((modulePath) => remoteContainer?.get(modulePath))
    );

    const modules = moduleFactories.map((modFactory) => {
      if (!modFactory) return undefined;
      return modFactory();
    });

    return modules;
  } catch (error) {
    console.error('[mf] - Unable to getModules', error);
    return undefined;
  }
};