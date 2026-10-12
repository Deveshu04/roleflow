import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
// Tag and convert as BT.709 so browsers show the same colours as the Studio.
Config.setColorSpace("bt709");
Config.setOverwriteOutput(true);
// Low to fit modest machines; raise for faster renders.
Config.setConcurrency(2);
