const base = require('./app.json').expo;
module.exports = () => {
  const play = process.env.EXPO_PUBLIC_DISTRIBUTION === 'play';
  const blocked = ['android.permission.ACCESS_FINE_LOCATION', 'android.permission.ACCESS_COARSE_LOCATION', 'android.permission.ACCESS_BACKGROUND_LOCATION', 'android.permission.REQUEST_INSTALL_PACKAGES'];
  return {
    ...base,
    extra: { ...base.extra, distribution: play ? 'play' : 'github' },
    android: { ...base.android,
      permissions: play ? base.android.permissions.filter(p => !['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'ACCESS_BACKGROUND_LOCATION', 'REQUEST_INSTALL_PACKAGES'].includes(p)) : base.android.permissions,
      blockedPermissions: [...new Set([...(base.android.blockedPermissions || []), ...(play ? blocked : [])])],
    },
    plugins: play ? base.plugins.filter(p => (Array.isArray(p) ? p[0] : p) !== 'expo-location') : base.plugins,
  };
};
