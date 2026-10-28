module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath:
          "import com.bitcodexwallet.auth.BitcodeXAuthBrowserPackage;",
        packageInstance: "new BitcodeXAuthBrowserPackage()",
      },
      ios: null,
    },
  },
};
