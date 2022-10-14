import { ConfigContext, ExpoConfig } from "@expo/config";
import { AndroidConfig,ConfigPlugin, withAndroidManifest, withPlugins } from "@expo/config-plugins";
import isEqual from "lodash.isequal";

const includesItem = <T>(list: T[], item: T) => {
  return list.find((i) => {
    return isEqual(i, item);
  });
};

// any type of child node you can have in an <application> node
type ManifestApplicationChild = Exclude<
  keyof AndroidConfig.Manifest.ManifestApplication,
  "$" // "$" are the attributes on the <application> node
>;

const addChildToApplication = (
  androidManifest: AndroidConfig.Manifest.AndroidManifest,
  item: NonNullable<
    AndroidConfig.Manifest.ManifestApplication[ManifestApplicationChild]
  > extends (infer U)[]
    ? U
    : never,
  type: ManifestApplicationChild,
  applicationName: string
) => {
  // make sure the AndroidManifest.xml representation is ok
  const application = androidManifest.manifest.application?.find(
    (a) => a.$["android:name"] === applicationName
  );
  if (!application) {
    throw new Error(
      `No applicaton with name "${applicationName}" found in AndroidManifest.xml`
    );
  }
  // find or create the children of given `type` (e.g. all <meta-data>, or all <services>, etc.)
  let children = application[type];
  if (!children) children = [];
  // and insert the given item if not already here
  if (!includesItem(children, item)) {
    children.push(item);
  }
  return androidManifest;
};

export const withMyReceiver: ConfigPlugin = (
  config
) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = addChildToApplication(config.modResults, {
      $: {
        "android:name":
          "com.anonymous.receiver",
      },
    }, "receiver", ".MainApplication");
    return config
  })
}

export const withMyMetaData: ConfigPlugin = (
  config
) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = addChildToApplication(config.modResults, {
      $: {
        "android:name":
          "com.anonymous.meta.data",
      },
    }, "meta-data", ".MainApplication");
    return config
  })
}

const baseConfig: ExpoConfig = {
  "name": "plugin-manifest",
  "slug": "plugin-manifest",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "light",
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#ffffff"
  },
  "updates": {
    "fallbackToCacheTimeout": 0
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.anonymous.pluginmanifest",
  },
  "android": {
    "package": "com.anonymous.pluginmanifest",
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#FFFFFF"
    }
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const withPluginsConfig: ExpoConfig = withPlugins({ ...config, ...baseConfig }, [
    withMyReceiver,
    withMyMetaData
  ]);
  return withPluginsConfig;
};