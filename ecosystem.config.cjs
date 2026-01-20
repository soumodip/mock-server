require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'mock-server',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        ...process.env,
      },
    }
  ]
};
