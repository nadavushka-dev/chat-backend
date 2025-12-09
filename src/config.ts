const config = {
  secret: process.env.SECRET!,
  databaseUrl: process.env.DATABASE_URL!,
  httpSizeLimit: "10kb",
  socketMaxHttpBufferSize: 1e4,
  corsOrigin: ["*"],
  port: process.env.PORT || 3000,
};

export default config;
