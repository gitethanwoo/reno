// iOS 27 stops apps at launch unless they adopt the scene life cycle.
// Expo 57 ships `ExpoAppSceneDelegate` for this, but its prebuild template
// still starts React Native from the app delegate, so wire it up here:
// the app delegate only creates the factory, and the scene delegate makes
// the window and starts React Native into it.
const {
  withAppDelegate,
  withInfoPlist,
  createRunOncePlugin,
} = require("expo/config-plugins");

const startInAppDelegate = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

function withSceneDelegate(config) {
  config = withAppDelegate(config, (config) => {
    let src = config.modResults.contents;
    if (src.includes("ExpoAppSceneDelegate")) return config;
    if (
      config.modResults.language !== "swift" ||
      !src.includes(startInAppDelegate)
    )
      throw new Error(
        "with-scene-delegate: AppDelegate.swift doesn't match the Expo 57 template; update the plugin.",
      );
    src = src
      .replace(
        "class AppDelegate: ExpoAppDelegate {",
        "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {",
      )
      .replace(startInAppDelegate, "");
    src += "\nclass SceneDelegate: ExpoAppSceneDelegate {}\n";
    config.modResults.contents = src;
    return config;
  });
  return withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          },
        ],
      },
    };
    return config;
  });
}

module.exports = createRunOncePlugin(withSceneDelegate, "with-scene-delegate");
