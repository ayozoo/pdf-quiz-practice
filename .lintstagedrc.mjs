export default {
  // client TS/TSX：prettier 格式化暂存文件 + 跑 client eslint
  'client/src/**/*.{ts,tsx}': (files) => [
    `prettier --write ${files.join(' ')}`,
    'npm run lint --prefix client',
  ],

  // server TS：prettier 格式化暂存文件 + 跑 server eslint
  'server/src/**/*.ts': (files) => [
    `prettier --write ${files.join(' ')}`,
    'npm run lint --prefix server',
  ],

  // 样式 / 配置 / 文档文件：只格式化
  '**/*.{css,json,md,yml,yaml}': (files) => [`prettier --write ${files.join(' ')}`],
};
