export default () => ({
  security: {
    jwtSecret: process.env.ACCESS_TOKEN_SECRET,
  },
});
