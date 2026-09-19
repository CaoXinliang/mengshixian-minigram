// C 端“吃什么”第一版为 AI 生成的临时内容配置，不代表正式菜谱或营养建议。
// 内容集中在本文件，便于后续接入后台或整体撤回，不散落到页面模板中。
module.exports = [
  {
    id: 'fo-tiao-qiang',
    title: '佛跳墙',
    scene: '宴客硬菜',
    cookMinutes: 90,
    servings: '4-6 人',
    summary: '鲍鱼与多种海味慢炖，适合节日家宴。',
    productKeywords: ['佛跳墙', '鲍鱼', '海参'],
    steps: ['食材提前解冻并分别焯水。', '加入高汤，小火慢炖至入味。', '按口味调味，热透后装盅。'],
    accent: '#d27a35'
  },
  {
    id: 'salt-baked-prawn',
    title: '盐焗虾',
    scene: '快手家常',
    cookMinutes: 20,
    servings: '2-3 人',
    summary: '咸香紧实，家庭聚餐也能快速上桌。',
    productKeywords: ['罗氏虾', '南美白对虾', '对虾', '明虾', '大虾', '基围虾'],
    excludeKeywords: ['龙虾', '虾饺', '虾滑', '虾仁'],
    steps: ['虾解冻后吸干表面水分。', '海盐炒热，铺入虾并加盖焗熟。', '虾身变红后关火，抖净盐粒。'],
    accent: '#e06a4c'
  },
  {
    id: 'oden',
    title: '关东煮',
    scene: '火锅暖锅',
    cookMinutes: 35,
    servings: '2-4 人',
    summary: '丸滑、蛋饺和蔬菜一锅煮，暖胃又省事。',
    productKeywords: ['鱼丸', '牛肉丸', '蛋饺', '关东煮'],
    steps: ['高汤煮开后先下耐煮食材。', '加入丸滑与蛋饺，中火煮透。', '最后放入蔬菜，按口味蘸食。'],
    accent: '#c08a32'
  },
  {
    id: 'pickled-fish',
    title: '酸菜鱼',
    scene: '家庭聚餐',
    cookMinutes: 30,
    servings: '3-4 人',
    summary: '酸香开胃，鱼片滑嫩，适合三四人分享。',
    productKeywords: ['酸菜鱼', '黑鱼片', '巴沙鱼柳', '鱼柳', '白鱼', '鱼片'],
    steps: ['鱼片解冻后沥水并简单腌制。', '酸菜炒香，加汤煮出底味。', '转小火逐片下鱼，熟后立即出锅。'],
    accent: '#6d9a52'
  },
  {
    id: 'garlic-scallop',
    title: '蒜蓉粉丝扇贝',
    scene: '宴客硬菜',
    cookMinutes: 25,
    servings: '3-4 人',
    summary: '蒜香浓郁、摆盘利落，是容易完成的宴客菜。',
    productKeywords: ['扇贝', '粉丝带子', '带子'],
    steps: ['扇贝解冻洗净，粉丝泡软。', '铺好粉丝与蒜蓉酱，上锅蒸熟。', '出锅撒葱花，淋少量热油。'],
    accent: '#c79a45'
  },
  {
    id: 'pan-seared-sirloin',
    title: '香煎小牛排',
    scene: '快手家常',
    cookMinutes: 18,
    servings: '1-2 人',
    summary: '外焦里嫩，搭配蔬菜就是一顿轻松正餐。',
    productKeywords: ['小牛排', '牛排'],
    steps: ['牛排完全解冻后吸干水分。', '热锅少油，两面煎至喜欢的熟度。', '静置片刻后切片，搭配蔬菜。'],
    accent: '#9b5a46'
  },
  {
    id: 'beef-hotpot',
    title: '肥牛火锅',
    scene: '火锅暖锅',
    cookMinutes: 25,
    servings: '3-5 人',
    summary: '肥牛、丸滑和时蔬自由搭配，聚餐不费心。',
    productKeywords: ['肥牛', '牛肉卷', '牛肉丸'],
    steps: ['准备锅底并将配菜分类摆盘。', '锅底煮沸后先下丸滑与蔬菜。', '肥牛随吃随涮，完全变色后食用。'],
    accent: '#d25a3f'
  },
  {
    id: 'dim-sum-breakfast',
    title: '港式早茶',
    scene: '早餐夜宵',
    cookMinutes: 20,
    servings: '2-3 人',
    summary: '蒸点与烤包组合上桌，在家也能轻松吃早茶。',
    productKeywords: ['虾饺', '烧麦', '烧卖', '菠萝包', '玉米包', '核桃包', '苹果包', '发糕'],
    steps: ['蒸锅水烧开，蒸点按包装说明间隔摆入。', '烤包按包装说明复热至中心热透。', '分批装盘，搭配热茶趁热享用。'],
    accent: '#d08b42'
  },
  {
    id: 'spicy-squid',
    title: '香辣鱿鱼花',
    scene: '早餐夜宵',
    cookMinutes: 18,
    servings: '2-3 人',
    summary: '香辣有嚼劲，适合作为夜宵或下饭小菜。',
    productKeywords: ['香辣鱿鱼花', '雕花鱿鱼'],
    steps: ['鱿鱼解冻焯水，充分沥干。', '葱姜蒜与辣椒炒香，加入鱿鱼。', '大火快速翻炒，调味后立即出锅。'],
    accent: '#d64f42'
  },
  {
    id: 'abalone-rice',
    title: '黄金鲍鱼捞饭',
    scene: '家庭聚餐',
    cookMinutes: 35,
    servings: '2-3 人',
    summary: '鲍鱼与浓汁盖饭，兼顾仪式感和饱腹感。',
    productKeywords: ['黄金鲍鱼', '黄金鲍', '鲍鱼'],
    steps: ['鲍鱼解冻清理，焯水备用。', '高汤加调味料煮开，放入鲍鱼煨熟。', '勾薄芡后浇在米饭与时蔬上。'],
    accent: '#b97734'
  }
].map((item) => ({
  ...item,
  source: 'ai_generated',
  temporary: true,
  version: 1,
  coverFallback: '/assets/icons/meal-card.svg'
}));
