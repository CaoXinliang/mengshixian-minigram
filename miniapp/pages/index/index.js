const { config: serviceConfig, auth: authApi, catalog: catalogApi, content: contentApi, address: addressApi, cart: cartApi, delivery: deliveryApi, checkout: checkoutApi, orders: ordersApi, refunds: refundsApi, groups: groupsApi } = require('../../services/index');
const { chunkUnique, fetchRemotePages } = require('../../services/collection');

const LOGIN_AGREED_STORAGE_KEY = 'mengshixian_login_agreed';
const ORDER_STATUS_LABELS = { pending_payment: '待付款', pending_confirmation: '待系统确认', picking: '备货中', shipping: '配送中', delivered: '待收货', completed: '已完成', cancelled: '已取消' };
const REFUND_STATUS_LABELS = { requested: '售后申请中', processing: '退款处理中', succeeded: '已退款', refunded: '已退款', rejected: '售后已驳回', failed: '退款失败' };
const ORDER_EMPTY_TITLE = { '全部订单': '暂无订单记录', '待付款': '暂无待付款订单', '待收货': '暂无待收货订单', '售后/退款': '暂无售后申请' };
const ORDER_EMPTY_HINT = { '待付款': '商品价格和库存以结算页为准', '待收货': '配送完成后可在这里确认收货', '售后/退款': '签收后商品异常可在售后服务中联系微信客服', '全部订单': '下单后会在这里显示订单状态和预计送达时间' };

const PRODUCTS = [
  { id: 1, name: "黄金鲍鱼肉", category: "海鲜水产", unit: "1件/20包/500克；品名规格：15头", sales: 0, tag: "待补充", img: "" },
  { id: 2, name: "黄金鲍", category: "海鲜水产", unit: "1件/25包/500g；品名规格：25头", sales: 0, tag: "待补充", img: "" },
  { id: 3, name: "鲍鱼", category: "海鲜水产", unit: "1件/20包/500克；品名规格：30头", sales: 0, tag: "待补充", img: "" },
  { id: 4, name: "全形豆角", category: "蔬菜类", unit: "1包/7斤装", sales: 0, tag: "待补充", img: "" },
  { id: 5, name: "A级香芋条", category: "蔬菜类", unit: "1件/10包/1.5KG", sales: 0, tag: "待补充", img: "" },
  { id: 6, name: "（东）西鳞鱼籽 红", category: "海鲜水产", unit: "1件/4盒/2包/850克", sales: 0, tag: "待补充", img: "" },
  { id: 7, name: "（东）西鳞鱼籽 黄", category: "海鲜水产", unit: "1件/4盒/2包/850克", sales: 0, tag: "待补充", img: "" },
  { id: 8, name: "（黑箱）2A金枪鱼", category: "海鲜水产", unit: "1*10KG/件", sales: 0, tag: "待补充", img: "" },
  { id: 9, name: "（吉食尚）粉丝带子", category: "海鲜水产", unit: "1件/10包/10个", sales: 0, tag: "待补充", img: "" },
  { id: 10, name: "（李家厨）个性三脆", category: "其他冻品", unit: "1件/25包/325克", sales: 0, tag: "待补充", img: "" },
  { id: 11, name: "（世味园）进口青豆", category: "蔬菜类", unit: "1件/12包/1KG", sales: 0, tag: "待补充", img: "" },
  { id: 12, name: "（饷之澄）手抓扇子骨", category: "猪肉类", unit: "1件/10包/10根", sales: 0, tag: "待补充", img: "" },
  { id: 13, name: "（饷之澄）手抓扇子骨", category: "猪肉类", unit: "1件/10包/12根", sales: 0, tag: "待补充", img: "" },
  { id: 14, name: "阿诺红糖发糕", category: "面点类", unit: "1件/15包/360克", sales: 0, tag: "待补充", img: "" },
  { id: 15, name: "阿诺爆浆麻薯", category: "甜品类", unit: "1件/12包/10个", sales: 0, tag: "待补充", img: "" },
  { id: 16, name: "阿诺春野三色", category: "甜品类", unit: "1件/15包/15个", sales: 0, tag: "待补充", img: "" },
  { id: 17, name: "阿诺脆皮泡芙", category: "甜品类", unit: "1件/10包/10个；品名规格：250克", sales: 0, tag: "待补充", img: "" },
  { id: 18, name: "阿诺脆皮酸奶卷", category: "甜品类", unit: "1件/12包/280克", sales: 0, tag: "待补充", img: "" },
  { id: 19, name: "阿诺红糖发糕", category: "面点类", unit: "1件/12包/600克", sales: 0, tag: "待补充", img: "" },
  { id: 20, name: "阿诺金丝榴莲酥", category: "甜品类", unit: "1件/12包/10个", sales: 0, tag: "待补充", img: "" },
  { id: 21, name: "阿诺金锥榴莲", category: "其他冻品", unit: "1件/20包/10个/30克", sales: 0, tag: "待补充", img: "" },
  { id: 22, name: "阿诺小厨黄色米网皮", category: "面点类", unit: "1件/12包/415克；品名规格：18个", sales: 0, tag: "待补充", img: "" },
  { id: 23, name: "安井核桃包", category: "面点类", unit: "1件/10包/360克", sales: 0, tag: "待补充", img: "" },
  { id: 24, name: "安井火山石烤肠(A级原味)", category: "烧烤炸品", unit: "1件/20包/700克", sales: 0, tag: "待补充", img: "" },
  { id: 25, name: "安井奶香玉米包", category: "面点类", unit: "1件/12包/360G", sales: 0, tag: "待补充", img: "" },
  { id: 26, name: "澳洲原切雪花肥牛", category: "牛肉类", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 27, name: "巴沙鱼柳（纯干）", category: "海鲜水产", unit: "1件/4包/5斤", sales: 0, tag: "待补充", img: "" },
  { id: 28, name: "白糖桂花糕", category: "甜品类", unit: "1件/24包/300G", sales: 0, tag: "待补充", img: "" },
  { id: 29, name: "半边白鱼", category: "海鲜水产", unit: "1件/20条/700-800克", sales: 0, tag: "待补充", img: "" },
  { id: 30, name: "半边白鱼", category: "海鲜水产", unit: "1件/18条；品名规格：600-700克", sales: 0, tag: "待补充", img: "" },
  { id: 31, name: "半排（小牛排）", category: "牛肉类", unit: "1.5斤*12片/件", sales: 0, tag: "待补充", img: "" },
  { id: 32, name: "小牛腿", category: "牛肉类", unit: "1件/10包/2斤左右", sales: 0, tag: "待补充", img: "" },
  { id: 33, name: "包心鱼丸", category: "丸滑类", unit: "2.5kg*4", sales: 0, tag: "待补充", img: "" },
  { id: 34, name: "保鲜青花椒", category: "调味酱料", unit: "1件/60包/300g", sales: 0, tag: "待补充", img: "" },
  { id: 35, name: "北记苹果包", category: "面点类", unit: "1件/15包/350克", sales: 0, tag: "待补充", img: "" },
  { id: 36, name: "北记什锦冰皮大福", category: "甜品类", unit: "1件/20包/250克", sales: 0, tag: "待补充", img: "" },
  { id: 37, name: "北京四系填鸭胚", category: "禽肉类", unit: "1件/4只/4.5斤", sales: 0, tag: "待补充", img: "" },
  { id: 38, name: "菠萝包", category: "面点类", unit: "1件/12包/380G/10个", sales: 0, tag: "待补充", img: "" },
  { id: 39, name: "波士顿龙虾", category: "海鲜水产", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 40, name: "参福连吉品佛跳墙", category: "预制菜熟食", unit: "1件/12盅/220克", sales: 0, tag: "待补充", img: "" },
  { id: 41, name: "诚宴好吃鸡", category: "禽肉类", unit: "1件/12只/1.4斤左右", sales: 0, tag: "待补充", img: "" },
  { id: 42, name: "初荷热狗卷", category: "烧烤炸品", unit: "1件/15包/480g", sales: 0, tag: "待补充", img: "" },
  { id: 43, name: "聪厨干锅牛杂", category: "牛肉类", unit: "1件/40包/250克", sales: 0, tag: "待补充", img: "" },
  { id: 44, name: "脆皮乳猪", category: "猪肉类", unit: "1*10只；品名规格：4.5斤", sales: 0, tag: "待补充", img: "" },
  { id: 45, name: "大号炸凤爪", category: "禽肉类", unit: "1件/4包/2.5KG", sales: 0, tag: "待补充", img: "" },
  { id: 46, name: "大佬强迷你甜甜圈", category: "甜品类", unit: "1件/9袋/18个", sales: 0, tag: "待补充", img: "" },
  { id: 47, name: "带皮小黄牛", category: "牛肉类", unit: "1件/40斤/称重", sales: 0, tag: "待补充", img: "" },
  { id: 48, name: "带皮羊切块", category: "羊肉类", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 49, name: "雕花鱿鱼", category: "海鲜水产", unit: "1件/10包/500克", sales: 0, tag: "待补充", img: "" },
  { id: 50, name: "冻牛蹄筋", category: "牛肉类", unit: "1件/40斤/称重", sales: 0, tag: "待补充", img: "" },
  { id: 51, name: "冻品先生黑鱼片", category: "海鲜水产", unit: "1件/25包/250克", sales: 0, tag: "待补充", img: "" },
  { id: 52, name: "对开猪手", category: "猪肉类", unit: "10kg", sales: 0, tag: "待补充", img: "" },
  { id: 53, name: "多用酥条（滋杨味）", category: "面点类", unit: "550g*4盒*1件", sales: 0, tag: "待补充", img: "" },
  { id: 54, name: "鹅翅", category: "禽肉类", unit: "1件*30斤*15包", sales: 0, tag: "待补充", img: "" },
  { id: 55, name: "发好花胶", category: "海鲜水产", unit: "净重500克", sales: 0, tag: "待补充", img: "" },
  { id: 56, name: "法式鹅肝 特A级", category: "禽肉类", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 57, name: "峰仔荷叶夹", category: "面点类", unit: "1件/12包/500g", sales: 0, tag: "待补充", img: "" },
  { id: 58, name: "峰仔樱花糕", category: "甜品类", unit: "1件/15包/300克", sales: 0, tag: "待补充", img: "" },
  { id: 59, name: "福煕泰精选墨鱼仔", category: "海鲜水产", unit: "1件/12包/450克；品名规格：14粒", sales: 0, tag: "待补充", img: "" },
  { id: 60, name: "海霸王牛筋丸", category: "丸滑类", unit: "1件/24包/250克", sales: 0, tag: "待补充", img: "" },
  { id: 61, name: "海带苗", category: "海鲜水产", unit: "1件/10包/500克", sales: 0, tag: "待补充", img: "" },
  { id: 62, name: "海蜇头（血蜇）", category: "海鲜水产", unit: "1桶/10斤", sales: 0, tag: "待补充", img: "" },
  { id: 63, name: "海鲈鱼", category: "海鲜水产", unit: "1件/15条/1.3斤左右", sales: 0, tag: "待补充", img: "" },
  { id: 64, name: "和办澳雪龙牛肉胶", category: "牛肉类", unit: "1件/2包/10斤", sales: 0, tag: "待补充", img: "" },
  { id: 65, name: "和办猪肉胶", category: "猪肉类", unit: "1件/2包/10斤", sales: 0, tag: "待补充", img: "" },
  { id: 66, name: "黑椒鸡块", category: "禽肉类", unit: "1件*10包*1KG", sales: 0, tag: "待补充", img: "" },
  { id: 67, name: "黑椒京城烤排", category: "烧烤炸品", unit: "1件/10包/1KG", sales: 0, tag: "待补充", img: "" },
  { id: 68, name: "黑椒肉眼脆皮猪扒", category: "猪肉类", unit: "1件/10包/1kg；品名规格：10片", sales: 0, tag: "待补充", img: "" },
  { id: 69, name: "黑松露", category: "调味酱料", unit: "1斤", sales: 0, tag: "待补充", img: "" },
  { id: 70, name: "黑玉参", category: "海鲜水产", unit: "1件/20包/500克", sales: 0, tag: "待补充", img: "" },
  { id: 71, name: "黑棕鹅", category: "禽肉类", unit: "1件/6只/称重", sales: 0, tag: "待补充", img: "" },
  { id: 72, name: "鸿成青虾仁", category: "海鲜水产", unit: "1件/10包/1kg；品名规格：26/30", sales: 0, tag: "待补充", img: "" },
  { id: 73, name: "红酒鹅肝", category: "禽肉类", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 74, name: "红芽香芋", category: "蔬菜类", unit: "1件/20包/500克", sales: 0, tag: "待补充", img: "" },
  { id: 75, name: "花胶（干货）", category: "海鲜水产", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 76, name: "皇帝贝", category: "海鲜水产", unit: "1件/10包/10个", sales: 0, tag: "待补充", img: "" },
  { id: 77, name: "鸡翅根", category: "禽肉类", unit: "1件/9kg", sales: 0, tag: "待补充", img: "" },
  { id: 78, name: "鸡蛋干", category: "禽肉类", unit: "1*50包/150g", sales: 0, tag: "待补充", img: "" },
  { id: 79, name: "鸡尖", category: "禽肉类", unit: "1件/10包/2斤", sales: 0, tag: "待补充", img: "" },
  { id: 80, name: "鸡米花", category: "禽肉类", unit: "1件/10包/900克", sales: 0, tag: "待补充", img: "" },
  { id: 81, name: "鸡腿", category: "禽肉类", unit: "8.7kg；品名规格：150g-180g", sales: 0, tag: "待补充", img: "" },
  { id: 82, name: "吉食尚麻香小饼（葱香味）", category: "面点类", unit: "1件/30包/400克/10个", sales: 0, tag: "待补充", img: "" },
  { id: 83, name: "吉食尚一品佛跳墙", category: "预制菜熟食", unit: "1件/10包/1.5KG", sales: 0, tag: "待补充", img: "" },
  { id: 84, name: "即食海参", category: "海鲜水产", unit: "根；品名规格：10头", sales: 0, tag: "待补充", img: "" },
  { id: 85, name: "酵香猪拱", category: "猪肉类", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 86, name: "桔子包", category: "面点类", unit: "1件/12包/350G", sales: 0, tag: "待补充", img: "" },
  { id: 87, name: "金榜蹄名", category: "猪肉类", unit: "1件/10个/2斤", sales: 0, tag: "待补充", img: "" },
  { id: 88, name: "金豆云朵", category: "甜品类", unit: "1件/12包/220克", sales: 0, tag: "待补充", img: "" },
  { id: 89, name: "金牌脆肚", category: "猪肉类", unit: "1件/25包/200G", sales: 0, tag: "待补充", img: "" },
  { id: 90, name: "金钱肚", category: "牛肉类", unit: "1*20kg", sales: 0, tag: "待补充", img: "" },
  { id: 91, name: "金宇翔吉可金太阳面饼", category: "面点类", unit: "1件/24包/12片；品名规格：6英寸", sales: 0, tag: "待补充", img: "" },
  { id: 92, name: "金玉满堂发糕", category: "面点类", unit: "包", sales: 0, tag: "待补充", img: "" },
  { id: 93, name: "金湄黄鱼", category: "海鲜水产", unit: "1件*20条；品名规格：500-600克", sales: 0, tag: "待补充", img: "" },
  { id: 94, name: "金湄黄鱼", category: "海鲜水产", unit: "1件/20条；品名规格：600-700克", sales: 0, tag: "待补充", img: "" },
  { id: 95, name: "精选牛肉粒", category: "牛肉类", unit: "1*20包*500g", sales: 0, tag: "待补充", img: "" },
  { id: 96, name: "井之源潮汕牛肉丸", category: "丸滑类", unit: "1件/20包/500g", sales: 0, tag: "待补充", img: "" },
  { id: 97, name: "九壹开花南瓜馒头", category: "面点类", unit: "1件/18包/6个/540g", sales: 0, tag: "待补充", img: "" },
  { id: 98, name: "聚菜优享牡丹虾球", category: "丸滑类", unit: "1件/10包/500g；品名规格：16/20", sales: 0, tag: "待补充", img: "" },
  { id: 99, name: "快厨奶油馒头", category: "面点类", unit: "1件/4包/1.5kg", sales: 0, tag: "待补充", img: "" },
  { id: 100, name: "老坛脆椒酱", category: "调味酱料", unit: "1件/16包/500克", sales: 0, tag: "待补充", img: "" },
  { id: 101, name: "乐掌勺免切牛排", category: "牛肉类", unit: "1件/20包/400克", sales: 0, tag: "待补充", img: "" },
  { id: 102, name: "乐掌勺蒜蓉粉丝扇贝", category: "海鲜水产", unit: "1件/10包/10个", sales: 0, tag: "待补充", img: "" },
  { id: 103, name: "乐掌勺五香金牌肘", category: "猪肉类", unit: "1件/15个/800克左右", sales: 0, tag: "待补充", img: "" },
  { id: 104, name: "乐掌勺盐焗鸡", category: "预制菜熟食", unit: "1*10只*±900克", sales: 0, tag: "待补充", img: "" },
  { id: 105, name: "雷洛滋保鲜膜", category: "耗材", unit: "1件/6卷", sales: 0, tag: "待补充", img: "" },
  { id: 106, name: "梨花鸭", category: "禽肉类", unit: "1件/8只/3.9斤", sales: 0, tag: "待补充", img: "" },
  { id: 107, name: "梨花鸭", category: "禽肉类", unit: "1件/6只/4.5斤", sales: 0, tag: "待补充", img: "" },
  { id: 108, name: "卤肥肠", category: "预制菜熟食", unit: "1件/20包/500克", sales: 0, tag: "待补充", img: "" },
  { id: 109, name: "罗氏虾", category: "海鲜水产", unit: "1件/10盒/500克；品名规格：13/15", sales: 0, tag: "待补充", img: "" },
  { id: 110, name: "罗氏虾", category: "海鲜水产", unit: "1件/10盒/750克；品名规格：16/20", sales: 0, tag: "待补充", img: "" },
  { id: 111, name: "罗氏虾", category: "海鲜水产", unit: "1件/8盒/700克；品名规格：6/8", sales: 0, tag: "待补充", img: "" },
  { id: 112, name: "美羊羊法式羊排", category: "羊肉类", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 113, name: "羊标排", category: "羊肉类", unit: "1件/20斤/8片", sales: 0, tag: "待补充", img: "" },
  { id: 114, name: "梦食鲜罐装果蔬泡菜", category: "预制菜熟食", unit: "1件/30包/620克", sales: 0, tag: "待补充", img: "" },
  { id: 115, name: "闽水单冻鱿鱼", category: "海鲜水产", unit: "1件/20斤", sales: 0, tag: "待补充", img: "" },
  { id: 116, name: "慕斯蛋糕（混合味）", category: "甜品类", unit: "1件/9盒/30块", sales: 0, tag: "待补充", img: "" },
  { id: 117, name: "牛肋排（原料）", category: "牛肉类", unit: "1件/30斤", sales: 0, tag: "待补充", img: "" },
  { id: 118, name: "牛仔骨（鑫银嘉）", category: "牛肉类", unit: "1件/20包/500克", sales: 0, tag: "待补充", img: "" },
  { id: 119, name: "牛腩", category: "牛肉类", unit: "1件/50斤/称重", sales: 0, tag: "待补充", img: "" },
  { id: 120, name: "泡椒藕带", category: "蔬菜类", unit: "1/20包/400G", sales: 0, tag: "待补充", img: "" },
  { id: 121, name: "泡椒银条", category: "蔬菜类", unit: "1件/20包/300克", sales: 0, tag: "待补充", img: "" },
  { id: 122, name: "泡椒鱼皮", category: "海鲜水产", unit: "150g*50包", sales: 0, tag: "待补充", img: "" },
  { id: 123, name: "培根", category: "猪肉类", unit: "1500克1*8包", sales: 0, tag: "待补充", img: "" },
  { id: 124, name: "奇特骨銀味三宝", category: "其他冻品", unit: "1件/20包/400克", sales: 0, tag: "待补充", img: "" },
  { id: 125, name: "切块甲鱼", category: "海鲜水产", unit: "1件/30包；品名规格：1.5-1.6斤", sales: 0, tag: "待补充", img: "" },
  { id: 126, name: "清远鸡", category: "禽肉类", unit: "1件/18只/2.45斤", sales: 0, tag: "待补充", img: "" },
  { id: 127, name: "球参", category: "海鲜水产", unit: "1件/20包/1斤", sales: 0, tag: "待补充", img: "" },
  { id: 128, name: "去骨鸭掌", category: "禽肉类", unit: "5KG/件；品名规格：10斤装", sales: 0, tag: "待补充", img: "" },
  { id: 129, name: "仁鸿小驴风味肉", category: "其他冻品", unit: "1*25包；品名规格：350克", sales: 0, tag: "待补充", img: "" },
  { id: 130, name: "肉菲粒", category: "其他冻品", unit: "1件/25包/350克", sales: 0, tag: "待补充", img: "" },
  { id: 131, name: "瑞士卷（混合味）", category: "甜品类", unit: "1件/18条/300克", sales: 0, tag: "待补充", img: "" },
  { id: 132, name: "三点蟹A级", category: "海鲜水产", unit: "1*4kg；品名规格：100/150", sales: 0, tag: "待补充", img: "" },
  { id: 133, name: "三全葱香手抓饼", category: "面点类", unit: "1件/8包/900克", sales: 0, tag: "待补充", img: "" },
  { id: 134, name: "三全蛋饺", category: "面点类", unit: "1件/60盒/150克", sales: 0, tag: "待补充", img: "" },
  { id: 135, name: "三全快厨豆沙包", category: "面点类", unit: "1件/4包/1.5KG", sales: 0, tag: "待补充", img: "" },
  { id: 136, name: "三全奶香馒头", category: "面点类", unit: "1件/8包/960克", sales: 0, tag: "待补充", img: "" },
  { id: 137, name: "三全糯米烧麦", category: "面点类", unit: "1件/10包/1KG；品名规格：1000克", sales: 0, tag: "待补充", img: "" },
  { id: 138, name: "三全酥脆油条", category: "面点类", unit: "1件/6包/800g", sales: 0, tag: "待补充", img: "" },
  { id: 139, name: "三全猪肉包", category: "面点类", unit: "1件/4包/1.5kg", sales: 0, tag: "待补充", img: "" },
  { id: 140, name: "深海响螺片", category: "海鲜水产", unit: "1件/30包/300g", sales: 0, tag: "待补充", img: "" },
  { id: 141, name: "手工花边水饺", category: "面点类", unit: "1件*6包*1.5kg", sales: 0, tag: "待补充", img: "" },
  { id: 142, name: "手工火腿荠菜丸", category: "丸滑类", unit: "1件/16包/12个/30克", sales: 0, tag: "待补充", img: "" },
  { id: 143, name: "手工烤鸭饼", category: "面点类", unit: "20张垫纸*100包", sales: 0, tag: "待补充", img: "" },
  { id: 144, name: "手工咸蛋卷", category: "甜品类", unit: "250G*40包/件", sales: 0, tag: "待补充", img: "" },
  { id: 145, name: "薯条", category: "烧烤炸品", unit: "1件/6包/2KG", sales: 0, tag: "待补充", img: "" },
  { id: 146, name: "探味水晶猪头肉", category: "猪肉类", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 147, name: "水鱼情深粉丝扇贝", category: "海鲜水产", unit: "1件/10包/10个", sales: 0, tag: "待补充", img: "" },
  { id: 148, name: "水煮碳烤笋", category: "蔬菜类", unit: "300g*30包*1件", sales: 0, tag: "待补充", img: "" },
  { id: 149, name: "四季渔乡深海黄鱼圆", category: "丸滑类", unit: "1件/18盒/500克", sales: 0, tag: "待补充", img: "" },
  { id: 150, name: "四季渔乡手撕小黄鱼", category: "海鲜水产", unit: "1件/50包/10条", sales: 0, tag: "待补充", img: "" },
  { id: 151, name: "四季渔乡小麦穗腰花", category: "猪肉类", unit: "1件/30包/240克", sales: 0, tag: "待补充", img: "" },
  { id: 152, name: "苏味盐水鸭(生胚)", category: "预制菜熟食", unit: "1件/10只/3斤", sales: 0, tag: "待补充", img: "" },
  { id: 153, name: "蒜香雪花脆肉", category: "猪肉类", unit: "250克", sales: 0, tag: "待补充", img: "" },
  { id: 154, name: "泰国香虾", category: "海鲜水产", unit: "1件/10盒/750g；品名规格：28-30条、30/40", sales: 0, tag: "待补充", img: "" },
  { id: 155, name: "泰甜香虾", category: "海鲜水产", unit: "1件/10盒/1kg；品名规格：41/50", sales: 0, tag: "待补充", img: "" },
  { id: 156, name: "探之味脆炸粉", category: "调味酱料", unit: "1件/2桶/1.3KG", sales: 0, tag: "待补充", img: "" },
  { id: 157, name: "探之味黑金红烧酱", category: "调味酱料", unit: "1件/2桶/1.8KG", sales: 0, tag: "待补充", img: "" },
  { id: 158, name: "探之味金椒酱", category: "调味酱料", unit: "1件/2桶/2KG", sales: 0, tag: "待补充", img: "" },
  { id: 159, name: "探之味翘壳河鲜酱", category: "调味酱料", unit: "1件/2桶/2KG", sales: 0, tag: "待补充", img: "" },
  { id: 160, name: "天厨鲍汁", category: "调味酱料", unit: "1*12袋*1KG", sales: 0, tag: "待补充", img: "" },
  { id: 161, name: "甜酒饼", category: "调味酱料", unit: "1件/20包/350g", sales: 0, tag: "待补充", img: "" },
  { id: 162, name: "无骨鸡爪", category: "禽肉类", unit: "1件/10斤/称重", sales: 0, tag: "待补充", img: "" },
  { id: 163, name: "五彩燕麦包", category: "面点类", unit: "1件/12包/10个/300克", sales: 0, tag: "待补充", img: "" },
  { id: 164, name: "西冷牛排", category: "牛肉类", unit: "1件/50包/150g", sales: 0, tag: "待补充", img: "" },
  { id: 165, name: "香葱肉丸", category: "丸滑类", unit: "1件/4包/2KG", sales: 0, tag: "待补充", img: "" },
  { id: 166, name: "香芋地瓜丸", category: "丸滑类", unit: "1件/10包/400g", sales: 0, tag: "待补充", img: "" },
  { id: 167, name: "祥口福葱油饼", category: "面点类", unit: "1件/10包/12个", sales: 0, tag: "待补充", img: "" },
  { id: 168, name: "小炒脆肚", category: "猪肉类", unit: "1件/30包/248克", sales: 0, tag: "待补充", img: "" },
  { id: 169, name: "小河虾", category: "海鲜水产", unit: "1件/10盒/500克；品名规格：60-80", sales: 0, tag: "待补充", img: "" },
  { id: 170, name: "小鸡腰", category: "禽肉类", unit: "500g", sales: 0, tag: "待补充", img: "" },
  { id: 171, name: "熊猫米发糕", category: "面点类", unit: "1件/12包/220克", sales: 0, tag: "待补充", img: "" },
  { id: 172, name: "熊猫同学水晶虾饺", category: "面点类", unit: "1件/15包/300克", sales: 0, tag: "待补充", img: "" },
  { id: 173, name: "熊猫同学蒜香小排", category: "猪肉类", unit: "1件/25包/400克", sales: 0, tag: "待补充", img: "" },
  { id: 174, name: "雪花霜降肥牛", category: "牛肉类", unit: "1件/7包/7.2斤", sales: 0, tag: "待补充", img: "" },
  { id: 175, name: "鸭二节翅", category: "禽肉类", unit: "10kg；品名规格：L码", sales: 0, tag: "待补充", img: "" },
  { id: 176, name: "匠传黑鸭煲", category: "预制菜熟食", unit: "1件/12盒/1.22KG", sales: 0, tag: "待补充", img: "" },
  { id: 177, name: "亚朵骄青椒酱（吉时尚）", category: "调味酱料", unit: "1件/60包/250克", sales: 0, tag: "待补充", img: "" },
  { id: 178, name: "宴果子巨无霸油条", category: "面点类", unit: "1件/10根/50厘米", sales: 0, tag: "待补充", img: "" },
  { id: 179, name: "羊蝎子（全肉）", category: "羊肉类", unit: "1件/10KG", sales: 0, tag: "待补充", img: "" },
  { id: 180, name: "易太梦之香排骨", category: "猪肉类", unit: "1*20包；品名规格：400克", sales: 0, tag: "待补充", img: "" },
  { id: 181, name: "优质海参", category: "海鲜水产", unit: "称重", sales: 0, tag: "待补充", img: "" },
  { id: 182, name: "游龙斑鱼", category: "海鲜水产", unit: "1件/20条", sales: 0, tag: "待补充", img: "" },
  { id: 183, name: "鱼水情深原浆墨鱼仔", category: "海鲜水产", unit: "1件/12包/450g", sales: 0, tag: "待补充", img: "" },
  { id: 184, name: "禹香都小酥肉", category: "猪肉类", unit: "1件/10包/800G", sales: 0, tag: "待补充", img: "" },
  { id: 185, name: "原点荷叶夹", category: "面点类", unit: "415g*12包", sales: 0, tag: "待补充", img: "" },
  { id: 186, name: "原味黄瓜", category: "蔬菜类", unit: "20包", sales: 0, tag: "待补充", img: "" },
  { id: 187, name: "原味牛肉片", category: "牛肉类", unit: "1件/20包/500g", sales: 0, tag: "待补充", img: "" },
  { id: 188, name: "悦道徽派酱鸭", category: "预制菜熟食", unit: "1件/20包/1.5斤", sales: 0, tag: "待补充", img: "" },
  { id: 189, name: "整条白鱼", category: "海鲜水产", unit: "1件/20条；品名规格：600-700克", sales: 0, tag: "待补充", img: "" },
  { id: 190, name: "众客S鸭庆", category: "禽肉类", unit: "1件/12袋/1KG", sales: 0, tag: "待补充", img: "" },
  { id: 191, name: "最呀咪彩盒熟冻对虾", category: "海鲜水产", unit: "1件/6盒/750克/40-42条；品名规格：50/60", sales: 0, tag: "待补充", img: "" },
  { id: 192, name: "最呀咪香虾", category: "海鲜水产", unit: "1件/10盒/500克；品名规格：16/20", sales: 0, tag: "待补充", img: "" },
  { id: 193, name: "萃阳楼漂烫去腥凤爪去甲", category: "禽肉类", unit: "1件/2包/10斤/360个左右；品名规格：25-30克", sales: 0, tag: "待补充", img: "" },
  { id: 194, name: "孚德盐酥鸡", category: "禽肉类", unit: "1件/10包/1KG", sales: 0, tag: "待补充", img: "" },
  { id: 195, name: "腱子肉", category: "牛肉类", unit: "1件/50斤", sales: 0, tag: "待补充", img: "" },
  { id: 196, name: "鑫银嘉黑椒猪排", category: "猪肉类", unit: "1件/20包/400克", sales: 0, tag: "待补充", img: "" },
  { id: 197, name: "鑫银嘉珍火牛力骨", category: "牛肉类", unit: "1*10kg；品名规格：15-16支", sales: 0, tag: "待补充", img: "" },
  { id: 198, name: "鑫银嘉孜然羊排", category: "羊肉类", unit: "1件/12包/500G", sales: 0, tag: "待补充", img: "" },
  { id: 199, name: "鱿鱼须", category: "海鲜水产", unit: "1件/7斤", sales: 0, tag: "待补充", img: "" },
  { id: 200, name: "鱿鱼须", category: "海鲜水产", unit: "1件/9公斤/称重", sales: 0, tag: "待补充", img: "" }
];
const LOCAL_PRODUCT_LIMIT = 50;
PRODUCTS.splice(LOCAL_PRODUCT_LIMIT);

const CATEGORY_BENEFITS = {};
const ALL_CATEGORIES = ['全部', '海鲜水产', '牛肉类', '猪肉类', '禽肉类', '羊肉类', '丸滑类', '面点类', '烧烤炸品', '预制菜熟食', '蔬菜类', '调味酱料', '甜品类', '耗材', '其他冻品'];
PRODUCTS.forEach(product => {
  const rawUnit = String(product.unit || '').trim();
  const specStart = rawUnit.indexOf('品名规格');
  if (specStart >= 0) {
    const packaging = rawUnit.slice(0, specStart).replace(/[；;]\s*$/, '').trim();
    const spec = rawUnit.slice(specStart).replace(/^品名规格\s*[:：]\s*/, '').trim();
    product.unit = packaging || rawUnit;
    product.specLabel = spec;
    if (spec) product.specs = [spec];
  }
  product.benefit = '\u51b7\u94fe\u914d\u9001 \u00b7 \u5bb6\u5ead\u56e4\u8d27';
  if (!product.img) product.img = '/assets/products/placeholder.svg';
});
// 分类展示仅作客户端兜底；正式环境会由内容与商品接口返回，不能用它替代后台分类数据。
// 每个已导入分类独立展示，避免把不同品类合并为“肉类”“火锅”等泛分类。
const CATEGORY_PRESENTATION = [
  { id: 'seafood', label: '海鲜水产', image: '/assets/categories/seafood.jpg' },
  { id: 'beef', label: '牛肉类', image: '/assets/categories/beef.jpg' },
  { id: 'pork', label: '猪肉类', image: '/assets/categories/pork-ai-v1.jpg' },
  { id: 'lamb', label: '羊肉类', image: '/assets/categories/lamb-ai-v1.jpg' },
  { id: 'poultry', label: '禽肉类', image: '/assets/categories/chicken.jpg' },
  { id: 'balls', label: '丸滑类', image: '/assets/categories/balls.jpg' },
  { id: 'pastry', label: '面点类', image: '/assets/categories/dumpling.jpg' },
  { id: 'prepared', label: '预制菜熟食', image: '/assets/categories/prepared-food-ai-v1.jpg' },
  { id: 'barbecue', label: '烧烤炸品', image: '/assets/categories/barbecue-fried-ai-v1.jpg' },
  { id: 'vegetables', label: '蔬菜类', image: '/assets/categories/vegetables.jpg' },
  { id: 'sauces', label: '调味酱料', image: '/assets/categories/sauces.jpg' },
  { id: 'desserts', label: '甜品类', image: '/assets/categories/desserts.jpg' },
  { id: 'other-frozen', label: '其他冻品', image: '/assets/categories/other-frozen-ai-v1.jpg' },
  { id: 'supplies', label: '耗材', image: '/assets/categories/supplies-ai-v1.jpg' }
];
const CATEGORY_GROUPS = CATEGORY_PRESENTATION.map((item) => ({ ...item, categories: [item.label] })).concat([
  { id: '全部', label: '全部分类', image: '/assets/products/frozen-hero-v2.jpg', categories: PRODUCTS.map(product => product.category).filter((category, index, list) => list.indexOf(category) === index) }
]);
// 首页只保留已确认的五个主分类；完整分类仍在分类页中展示和滚动选择。
const HOME_CATEGORY_LIMIT = 5;
const HOME_CATEGORIES = CATEGORY_PRESENTATION.slice(0, HOME_CATEGORY_LIMIT).map(({ label, image }) => ({ label, image }));
const BANNER_ITEMS = [
  { image: '/assets/products/frozen-hero-v2.jpg', eyebrow: '中秋家庭囤货季', headline: '鲜冻好物\n悦享团圆', subline: '全场满 99 元免基础配送费' },
  { image: '/assets/products/frozen-shrimp-pack-v2.jpg', eyebrow: '冷链海鲜专场', headline: '海鲜囤货\n鲜享到家', subline: '虾仁、鱼段等冷冻海鲜低至 8 折' },
  { image: '/assets/products/frozen-beef-pack-v2.jpg', eyebrow: '家庭火锅季', headline: '火锅肉卷\n一站备齐', subline: '精选牛羊肉卷，冷链直达餐桌' }
];
const GROUP_DEALS = [
  { productId: 1, size: 5, joined: 3, ends: '\u660e\u5929 18:00 \u622a\u6b62' },
  { productId: 9, size: 8, joined: 5, ends: '\u4eca\u665a 22:00 \u622a\u6b62' },
  { productId: 31, size: 4, joined: 2, ends: '\u540e\u5929 12:00 \u622a\u6b62' }
].map(deal => ({ ...deal, product: PRODUCTS.find(product => product.id === deal.productId) }));
const FREIGHT_RULE = { role: 'B', free: 199, fee: 15, text: 'B\u7aef\u5546\u5bb6\u91c7\u8d2d\u914d\u9001\uff1a\u6ee1 199 \u5143\u514d\u57fa\u7840\u914d\u9001\u8d39\uff0c\u672a\u6ee1\u6536 15 \u5143' };
const WAREHOUSE_AREAS = {
  '\u8d63\u5dde\u4ed3': ['\u7ae0\u8d21\u533a', '\u8d63\u53bf\u533a', '\u5357\u5eb7\u533a', '\u8d63\u5dde\u7ecf\u5f00\u533a', '\u84c9\u6c5f\u65b0\u533a'],
  '\u5357\u5eb7\u4ed3': ['\u5357\u5eb7\u533a', '\u9f99\u5357\u5e02', '\u4fe1\u4e30\u53bf', '\u5927\u4f59\u53bf']
};
const WAREHOUSES = [{ name: '赣州仓', eta: '预计今天 18:30 前送达' }, { name: '南康仓', eta: '预计今天 19:30 前送达' }];
const UTILITY = {
  group: ['拼团专场', '人满自动成团，拼团价不区分顾客和商家'],
  warehouse: ['选择配送仓', '配送范围和到货时间以所选仓为准'], activity: ['活动头条', '商品优惠以商品页和确认订单为准'], special: ['特价专区', '家庭冻品优惠以页面展示为准'], orders: ['我的订单', '订单信息将在这里展示'], coupon: ['优惠活动', '商品优惠以商品页和确认订单为准'], address: ['收货地址', '管理配送地址'], checkout: ['确认订单', '请确认收货信息与预计送达时间'], demoPayment: ['支付确认（测试）', '测试环境不会唤起微信支付或发生扣款'], service: ['微信客服', '订单和配送问题可通过微信客服咨询'], favorites: ['我的收藏', '已收藏的食材会在这里展示'], trace: ['商品保障说明', '商品生产信息和批次号以实际包装为准'], aftersale: ['售后服务', '售后规则以订单和店铺说明为准'], invoice: ['开票说明', '在线开票服务待订单服务接入后开放'], points: ['积分中心', '每日签到可获得积分'], review: ['评价晒单', '订单完成后可查看可评价商品'], coldchain: ['冷链服务说明', '配送范围和服务规则以所选仓为准'], about: ['关于梦食鲜', '让家庭囤货更安心'], faq: ['常见问题', '下单与配送常见问题'], policy: ['服务条款', '购物服务与隐私说明'], account: ['账户信息', '会员等级与账户设置'], businessApplication: ['商家采购申请', '提交企业资料后由运营审核']
};

const money = value => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  return number.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
};
const moneyCent = value => (Number(value || 0) / 100).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
const maskedPhone = phone => String(phone).replace(/^(\d{3})\d+(\d{4})$/, '$1****$2');
const RECEIPT_ORDER_STATUSES = ['picking', 'shipping', 'delivered'];
const hasPriceAmount = price => Boolean(price && price.amountCent !== '' && price.amountCent !== null && price.amountCent !== undefined && Number.isInteger(Number(price.amountCent)));
const ORDER_TRACKING_STEPS = [
  { key: 'pending_confirmation', label: '订单已提交' },
  { key: 'picking', label: '备货中' },
  { key: 'shipping', label: '配送中' },
  { key: 'delivered', label: '已送达' },
  { key: 'completed', label: '已完成' }
];
function priceText(price) {
  if (!hasPriceAmount(price)) return '登录后查看价格';
  return `¥${moneyCent(price.amountCent)}`;
}
function cartQuantityFor(product, cartItems, selectedSpec) {
  if (!product) return 0;
  const spec = selectedSpec || product.specLabel || product.unit;
  return (cartItems || []).filter((item) => String(item.id) === String(product.id) && item.selectedSpec === spec).reduce((sum, item) => sum + Number(item.qty || 0), 0);
}
function productWithPrice(product, priceBySku, selectedSpec) {
  const sku = (product.skuOptions || []).find((item) => item.label === selectedSpec) || (product.skuOptions || [])[0] || null;
  const price = sku && priceBySku && priceBySku[sku.id];
  return { ...product, specLabel: sku && sku.label || product.specLabel, unit: sku && sku.packageUnit || product.unit, selectedSkuId: sku && sku.id || product.selectedSkuId, price: hasPriceAmount(price) ? Number(price.amountCent) / 100 : undefined, priceText: priceText(price), priceTemporary: Boolean(hasPriceAmount(price) && price.temporary) };
}
function orderTracking(status) {
  const currentIndex = ORDER_TRACKING_STEPS.findIndex((item) => item.key === status);
  const trackingSteps = ORDER_TRACKING_STEPS.map((item, index) => ({ ...item, reached: currentIndex >= index, current: currentIndex === index }));
  const trackingHint = status === 'completed' ? '顾客已确认收货，订单已完成。' : status === 'delivered' ? '商品已送达，请确认收货。' : status === 'shipping' ? '商品正在配送中。' : status === 'picking' ? '订单已确认，正在备货。' : status === 'pending_confirmation' ? '订单已提交，等待进入备货流程。' : status === 'pending_payment' ? '订单等待支付确认。' : status === 'cancelled' ? '订单已取消。' : '订单状态同步中。';
  return { trackingSteps, trackingHint };
}
function toOrderRow(order, options = {}) {
  return {
    id: order._id,
    summary: options.summary || `订单 ${order.orderNo || order._id}`,
    total: money(Number(order.totalAmountCent || 0) / 100),
    totalAmountCent: Number(order.totalAmountCent || 0),
    amountLabel: order.paymentMethod === 'demo' ? '订单金额' : '实付',
    deliveryTime: options.deliveryTime || order.deliverySlotSnapshot && order.deliverySlotSnapshot.name || '预计送达时间以订单为准',
    status: REFUND_STATUS_LABELS[order.refundStatus] || ORDER_STATUS_LABELS[order.status] || order.status,
    rawStatus: order.status,
    paymentStatus: order.paymentStatus || '',
    refundStatus: order.refundStatus || '',
    canCancel: order.status === 'pending_payment' || (order.status === 'pending_confirmation' && order.paymentStatus !== 'paid'),
    canConfirm: order.status === 'delivered' && !order.refundStatus,
    canRefund: order.paymentStatus === 'paid' && ['pending_confirmation', 'picking', 'shipping', 'delivered', 'completed'].includes(order.status) && !['requested', 'processing', 'succeeded', 'refunded'].includes(order.refundStatus),
    ...orderTracking(order.status)
  };
}
function orderMatchesFilter(row, filter) {
  if (filter === '待付款') return row.rawStatus === 'pending_payment';
  if (filter === '待收货') return RECEIPT_ORDER_STATUSES.includes(row.rawStatus) && !row.refundStatus;
  if (filter === '售后/退款') return Boolean(row.refundStatus);
  return true;
}
function orderEmptyCopy(filter, field) {
  const source = field === 'title' ? ORDER_EMPTY_TITLE : ORDER_EMPTY_HINT;
  return source[filter] || source['全部订单'] || '';
}
const calculateTotals = cartItems => {
  const goodsTotal = cartItems.reduce((sum, item) => sum + (Number.isFinite(item.price) ? item.price * item.qty : 0), 0);
  if (!goodsTotal) return { cartTotal: '\u4ef7\u683c\u5f85\u8865\u5145', freightTotal: '\u5f85\u5546\u54c1\u5b9a\u4ef7', orderTotal: '\u4ef7\u683c\u5f85\u8865\u5145' };
  const freight = goodsTotal >= FREIGHT_RULE.free ? 0 : FREIGHT_RULE.fee;
  return { cartTotal: money(goodsTotal), freightTotal: freight ? money(freight) : '0', orderTotal: money(goodsTotal + freight) };
};
const selectedCartItems = cartItems => (cartItems || []).filter(item => item.selected !== false);
const selectedCartSummary = cartItems => {
  const selected = selectedCartItems(cartItems);
  if (!selected.length) return { selectedCartCount: 0, selectedCartTotal: '0' };
  return { selectedCartCount: selected.reduce((sum, item) => sum + Number(item.qty || 0), 0), selectedCartTotal: calculateTotals(selected).cartTotal };
};
const hasMultiSku = items => (items || []).some((item) => item && Array.isArray(item.specs) && item.specs.length > 1);
const customerWarehouseName = name => String(name || '配送仓').replace(/演示/g, '').replace(/\s{2,}/g, ' ').trim() || '配送仓';
const customerAddressText = (value, fallback) => String(value || '').replace(/梦食鲜演示收货点（非客户地址）/g, '已保存的收货地址').replace(/演示用户/g, '收货人').replace(/演示/g, '').trim() || fallback;
const IS_CLOUD_MODE = serviceConfig.provider === 'cloudbase';
const EMPTY_ADDRESS = { id: '', name: '', phone: '', masked: '', detail: '', regionCode: '' };
const EMPTY_WAREHOUSE = { name: '', eta: '' };
function identityProfile(user) {
  if (user && user.userType === 'b') return { profileTitle: '梦食鲜商家', profileSub: '商家采购账号' };
  if (user && user.businessStatus === 'pending') return { profileTitle: '梦食鲜顾客', profileSub: '企业采购申请审核中' };
  if (user && user.businessStatus === 'rejected') return { profileTitle: '梦食鲜顾客', profileSub: '企业申请未通过，可重新提交' };
  return { profileTitle: '梦食鲜顾客', profileSub: '微信用户 · 普通会员' };
}

function orderCategoriesForHome(rows) {
  const presentationOrder = CATEGORY_PRESENTATION.reduce((output, item, index) => ({ ...output, [item.label]: index }), {});
  return rows.slice().sort((left, right) => {
    const leftRank = presentationOrder[left.name];
    const rightRank = presentationOrder[right.name];
    if (leftRank !== undefined || rightRank !== undefined) return (leftRank === undefined ? Number.MAX_SAFE_INTEGER : leftRank) - (rightRank === undefined ? Number.MAX_SAFE_INTEGER : rightRank);
    return Number(left.sort || 0) - Number(right.sort || 0) || String(left.name || '').localeCompare(String(right.name || ''));
  });
}

Page({
  data: {
    navSafeHeight: '108rpx',
    navContentTop: '170rpx',
    catalogHeight: '360px', catalogResultsScrollTop: 0, checkoutItems: [], checkoutItemCount: 0, checkoutItemQty: 0,
    page: 'home', pageMotion: false, pageScrollTop: 0, activeTab: 'home', query: '', category: '全部', categoryGroup: IS_CLOUD_MODE ? '全部' : CATEGORY_GROUPS[0].id, activeGroup: IS_CLOUD_MODE ? null : CATEGORY_GROUPS[0], subCategories: IS_CLOUD_MODE ? ['全部'] : ALL_CATEGORIES, categoryProducts: [], homeSections: [], activityTitle: '活动头条', activityCopy: '速冻面点、火锅食材、海鲜水产陆续上新', activityMoreText: '更多', specialTitle: '特价专区', specialSubtitle: '家庭囤货好价', specialMoreText: '更多',
    products: IS_CLOUD_MODE ? [] : PRODUCTS, homeCategories: IS_CLOUD_MODE ? [] : HOME_CATEGORIES, categoryGroups: IS_CLOUD_MODE ? [] : CATEGORY_GROUPS, bannerItems: IS_CLOUD_MODE ? [] : BANNER_ITEMS, specials: IS_CLOUD_MODE ? [] : PRODUCTS.slice(0, 8), frequent: IS_CLOUD_MODE ? [] : [PRODUCTS[1], PRODUCTS[0], PRODUCTS[2], PRODUCTS[6]], frequentHasMultiSku: IS_CLOUD_MODE ? false : hasMultiSku([PRODUCTS[1], PRODUCTS[0], PRODUCTS[2], PRODUCTS[6]]), groupDeals: IS_CLOUD_MODE ? [] : GROUP_DEALS, freightRule: FREIGHT_RULE, warehouseAreaText: IS_CLOUD_MODE ? '' : WAREHOUSE_AREAS[WAREHOUSES[0].name].join('、'),
    warehouse: IS_CLOUD_MODE ? EMPTY_WAREHOUSE : WAREHOUSES[0], warehouses: IS_CLOUD_MODE ? [] : WAREHOUSES, address: { ...EMPTY_ADDRESS },
    cartItems: IS_CLOUD_MODE ? [] : [{ ...PRODUCTS[1], selected: true, selectedSpec: PRODUCTS[1].specLabel || PRODUCTS[1].unit, qty: 2 }, { ...PRODUCTS[3], selected: true, selectedSpec: PRODUCTS[3].specLabel || PRODUCTS[3].unit, qty: 1 }], cartCount: IS_CLOUD_MODE ? 0 : 3, selectedCartCount: IS_CLOUD_MODE ? 0 : 3, cartTotal: '\u4ef7\u683c\u5f85\u8865\u5145', selectedCartTotal: '\u4ef7\u683c\u5f85\u8865\u5145', freightTotal: '\u5f85\u5546\u54c1\u5b9a\u4ef7', orderTotal: '\u4ef7\u683c\u5f85\u8865\u5145',
    selectedProduct: null, selectedGroup: null, selectedSpec: '', detailDraftQty: 1, detailReturnPage: 'home', detailImageSrc: '', detailImageLoading: false, detailImageError: false, quantityPickerVisible: false, quantityPickerProduct: null, quantityPickerSpec: '', quantityPickerQty: 1, demoPaymentOrder: null, checkoutQuoteState: 'idle', catalogStatus: IS_CLOUD_MODE ? 'loading' : 'ready', priceFallback: '登录后查看价格', motionReduced: serviceConfig.motionEnabled === false, loggedIn: false, agreed: false, showLogin: false, loginMounted: false, loginVisible: false, cartFeedbackId: '', cartPulse: false, userType: '', businessStatus: '', profileTitle: '梦食鲜顾客', profileSub: '微信用户 · 普通会员', couponCount: IS_CLOUD_MODE ? 0 : 2, points: IS_CLOUD_MODE ? 0 : 268, checkedIn: false,
    utilityType: '', utilityTitle: '', utilitySub: '', orderFilter: '全部订单', showAddressForm: false, lastOrder: null, orderRows: [], allOrderRows: [], orderEmptyTitle: '暂无订单记录', orderEmptyHint: '下单后会在这里显示订单状态和预计送达时间', pendingReceiptCount: 0, orderActionBusyId: '', cloudModeEnabled: IS_CLOUD_MODE, businessSubmitting: false
  },

  onLoad() {
    this.syncCategory();
    this.refreshRemoteContent();
    if (IS_CLOUD_MODE) this.restoreRemoteSession();
    this.updateLayoutMetrics(wx.getSystemInfoSync());
  },
  onResize(res) {
    this.updateLayoutMetrics(res && res.size ? res.size : wx.getSystemInfoSync());
  },
  updateLayoutMetrics(system) {
    const windowWidth = system.windowWidth || 375;
    const windowHeight = system.windowHeight || 667;
    const menu = typeof wx.getMenuButtonBoundingClientRect === 'function' ? wx.getMenuButtonBoundingClientRect() : null;
    const storeRowHeight = 58 / 750 * windowWidth;
    const contentTop = Math.max(system.statusBarHeight || 0, menu ? menu.bottom + 4 : 0);
    const safeHeight = Math.max(system.statusBarHeight || 0, contentTop - storeRowHeight);
    const safeBottom = Math.max(0, (system.screenHeight || windowHeight) - ((system.safeArea && system.safeArea.bottom) || (system.screenHeight || windowHeight)));
    const catalogChromeHeight = (98 + 68 + 10 + 158) / 750 * windowWidth;
    const tabbarHeight = 112 / 750 * windowWidth;
    const catalogHeight = Math.max(260, Math.floor(windowHeight - contentTop - catalogChromeHeight - tabbarHeight - safeBottom));
    this.setData({
      navSafeHeight: `${Math.ceil(safeHeight / windowWidth * 750)}rpx`,
      navContentTop: `${Math.ceil(contentTop / windowWidth * 750)}rpx`,
      catalogHeight: `${catalogHeight}px`
    });
  },
  onShow() {
    if (!IS_CLOUD_MODE) return;
    const tasks = [];
    if (!this._contentRefreshedAt || Date.now() - this._contentRefreshedAt >= 30000) tasks.push(this.refreshRemoteContent());
    if (this.data.loggedIn || this._remoteUser) {
      tasks.push(Promise.resolve(this.loadRemoteCart()).catch(() => null));
      if (this.data.page === 'utility' && this.data.utilityType === 'orders') tasks.push(Promise.resolve(this.loadRemoteOrders()).catch(() => null));
    }
    return tasks.length ? Promise.all(tasks) : undefined;
  },
  refreshRemoteContent() {
    if (!IS_CLOUD_MODE) return Promise.resolve();
    if (this._contentRefresh) return this._contentRefresh;
    const loaders = [
      () => this.loadRemoteCatalog(), () => this.loadRemoteBanners(),
      () => this.loadRemoteHomeSections(), () => this.loadRemoteDeliveryOptions()
    ];
    this._contentRefresh = Promise.all(loaders.map(load => Promise.resolve().then(load).catch(() => null)))
      .finally(() => { this._contentRefreshedAt = Date.now(); this._contentRefresh = null; });
    return this._contentRefresh;
  },
  async loadRemoteHomeSections() {
    const result = await contentApi.getHomeSections({ platform: 'miniapp', page: 1, pageSize: 30 });
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return;
    const rows = result.data.rows;
    if (!rows.length) {
      if (IS_CLOUD_MODE) this.setData({ homeSections: [], activityTitle: '活动头条', activityCopy: '速冻面点、火锅食材、海鲜水产陆续上新', activityMoreText: '更多', specialTitle: '特价专区', specialSubtitle: '家庭囤货好价', specialMoreText: '更多' });
      return;
    }
    const patch = { homeSections: rows };
    const news = rows.find((item) => item.moduleType === 'news');
    const special = rows.find((item) => item.moduleType === 'special');
    if (news) {
      if (news.title) patch.activityTitle = news.title;
      if (news.subtitle) patch.activityCopy = news.subtitle;
      if (news.linkText) patch.activityMoreText = news.linkText;
    }
    if (special) {
      if (special.title) patch.specialTitle = special.title;
      if (special.subtitle) patch.specialSubtitle = special.subtitle;
      if (special.linkText) patch.specialMoreText = special.linkText;
    }
    if (!rows.some((item) => item.moduleType)) {
      if (rows[0] && rows[0].title) patch.activityTitle = rows[0].title;
      if (rows[1] && rows[1].title) patch.specialTitle = rows[1].title;
    }
    this.setData(patch);
  },
  async resolveMediaFileMap(ids) {
    const fileMap = {};
    const mediaChunks = chunkUnique(ids, 50);
    for (const mediaIds of mediaChunks) {
      const mediaResult = await contentApi.resolveMedia(mediaIds);
      const mediaRows = mediaResult && mediaResult.ok && mediaResult.data && Array.isArray(mediaResult.data.rows) ? mediaResult.data.rows : [];
      if (!mediaRows.length || typeof wx === 'undefined' || !wx.cloud || typeof wx.cloud.getTempFileURL !== 'function') continue;
      const fileOwners = {};
      mediaRows.forEach((item) => { if (item.fileId) fileOwners[item.fileId] = item; });
      for (const fileIds of chunkUnique(mediaRows.map((item) => item.fileId), 50)) {
        const urls = await wx.cloud.getTempFileURL({ fileList: fileIds }).catch(() => ({ fileList: [] }));
        (urls.fileList || []).forEach((file) => {
          const owner = fileOwners[file.fileID];
          if (owner && file.tempFileURL) fileMap[owner._id] = file.tempFileURL;
        });
      }
    }
    return fileMap;
  },
  async loadRemoteBanners() {
    const result = await contentApi.getBanners({ platform: 'miniapp', page: 1, pageSize: 10 });
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return;
    const rows = result.data.rows;
    if (!rows.length) {
      if (IS_CLOUD_MODE) this.setData({ bannerItems: [] });
      return;
    }
    const fileMap = await this.resolveMediaFileMap(rows.map((item) => item.mediaAssetId));
    const bannerItems = rows.map((item) => ({ image: fileMap[item.mediaAssetId] || '/assets/products/frozen-hero-v2.jpg', eyebrow: '梦食鲜冷链商城', headline: item.title || '鲜冻好物', subline: '冷链配送，安心送到家', jumpType: item.jumpType || 'none', jumpTarget: item.jumpTarget || '' }));
    this.setData({ bannerItems });
  },
  async loadRemoteDeliveryOptions() {
    const result = await deliveryApi.options();
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.warehouses)) return;
    if (!result.data.warehouses.length) {
      if (IS_CLOUD_MODE) this.setData({ warehouses: [], warehouse: { ...EMPTY_WAREHOUSE }, warehouseAreaText: '' });
      return;
    }
    const areas = Array.isArray(result.data.areas) ? result.data.areas : [];
    const warehouses = result.data.warehouses.map((item) => ({ ...item, id: item._id, name: customerWarehouseName(item.name), eta: '预计送达时间以订单确认页为准', areas: areas.filter((area) => !area.warehouseIds || !area.warehouseIds.length || area.warehouseIds.includes(item._id)).flatMap((area) => area.regionCodes || []) }));
    const warehouse = warehouses[0];
    this.setData({ warehouses, warehouse, warehouseAreaText: warehouse.areas.join('、') || '配送区域以订单确认页为准' });
  },
  async loadRemoteCatalog() {
    if (!IS_CLOUD_MODE) return;
    this.setData({ catalogStatus: 'loading' });
    const catalogResults = await Promise.all([
      fetchRemotePages((params) => catalogApi.listProducts(params), { pageSize: LOCAL_PRODUCT_LIMIT, maxPages: 1 }).catch(() => ({ ok: false })),
      fetchRemotePages((params) => catalogApi.listCategories(params), { pageSize: 100, maxPages: 20 }).catch(() => ({ ok: false }))
    ]);
    const result = catalogResults[0];
    const categoryResult = catalogResults[1];
    if (!result.ok || !categoryResult.ok) {
      this.setData({ catalogStatus: 'error' });
      return;
    }
    const remoteCategories = orderCategoriesForHome(categoryResult.rows);
    const categoryById = new Map(remoteCategories.map(item => [item._id, item]));
    let products = result.rows.slice(0, LOCAL_PRODUCT_LIMIT).map((item) => {
      const skuOptions = Array.isArray(item.skus) ? item.skus.map((sku) => ({ id: sku._id, label: sku.specName || sku.packageUnit || sku.netWeight || '默认规格', packageUnit: sku.packageUnit || '' })) : [];
      const specs = skuOptions.map((sku) => sku.label);
      const categoryName = (categoryById.get(item.categoryId) || {}).name || item.categoryName || '其他冻品';
      return {
      id: item._id,
      name: item.name || '未命名商品',
      category: categoryName,
      unit: skuOptions[0] && skuOptions[0].packageUnit ? skuOptions[0].packageUnit : '规格待补充',
      specLabel: specs[0] || '',
      specs,
      skuOptions,
      sales: 0,
      tag: '待补充',
      img: '/assets/products/placeholder.svg',
      coverMediaId: item.coverMediaId || '',
      benefit: '冷链配送 · 家庭囤货'
      };
    });
    const mediaIds = products.map((item) => item.coverMediaId).filter(Boolean);
    if (mediaIds.length) {
      const fileMap = await this.resolveMediaFileMap(mediaIds);
      products = products.map((item) => ({ ...item, img: fileMap[item.coverMediaId] || item.img }));
    }
    const categoryFiles = await this.resolveMediaFileMap(remoteCategories.map(item => item.imageMediaId));
    const categoryGroups = remoteCategories.map(item => ({
      id: item._id, label: item.name, categories: [item.name],
      image: categoryFiles[item.imageMediaId] || '/assets/products/placeholder.svg'
    }));
    const homeCategories = categoryGroups.slice(0, HOME_CATEGORY_LIMIT).map(({ label, image }) => ({ label, image }));
    categoryGroups.push({ id: '全部', label: '全部分类', image: '/assets/products/placeholder.svg', categories: [...new Set(products.map(item => item.category))] });
    const categoryGroup = categoryGroups.some(item => item.id === this.data.categoryGroup) ? this.data.categoryGroup : '全部';
    const category = remoteCategories.some(item => item.name === this.data.category) ? this.data.category : '全部';
    const frequent = products.slice(0, 4);
    this.setData({ products, specials: products.slice(0, 8), frequent, frequentHasMultiSku: hasMultiSku(frequent), categoryGroups, homeCategories, categoryGroup, category, catalogStatus: 'ready' }, () => { this.syncCategory(); this.loadRemoteGroupCampaigns(); });
    if (this.data.loggedIn || this._remoteUser) await this.loadRemoteCatalogPrices(products);
    else this._pricesWaitingLogin = true;
  },
  async loadRemoteCatalogPrices(products = this.data.products || []) {
    if (!IS_CLOUD_MODE || !(this.data.loggedIn || this._remoteUser)) {
      // 未登录：明确引导登录，而不是停留在"核验中"造成故障假象
      if (this.data.priceFallback !== '登录后查看价格') this.setData({ priceFallback: '登录后查看价格' });
      return;
    }
    // 优先使用本地缓存的价格即时渲染，避免每次冷启动都闪现"核验中"
    if (!this._remotePriceBySku || !Object.keys(this._remotePriceBySku).length) {
      const cached = wx.getStorageSync('mx_price_cache');
      if (cached && cached.bySku && Object.keys(cached.bySku).length) {
        this._remotePriceBySku = cached.bySku;
        this.applyRemotePriceLabels();
      }
    }
    if (this._remotePricesRequest) return this._remotePricesRequest;
    const skuIds = [...new Set(products.flatMap((item) => (item.skuOptions || []).map((sku) => sku.id)).filter(Boolean))];
    if (!skuIds.length) return;
    // 加载期间保留上一次的价格展示，不再闪现"核验中"
    this._remotePricesRequest = (async () => {
      const result = await catalogApi.listPrices(skuIds);
      if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return false;
      this._remotePriceBySku = result.data.rows.reduce((output, item) => ({ ...output, [item.skuId]: item }), {});
      try { wx.setStorageSync('mx_price_cache', { bySku: this._remotePriceBySku, at: Date.now() }); } catch (_) {}
      this.applyRemotePriceLabels();
      return true;
    })();
    try { return await this._remotePricesRequest; } finally {
      this._remotePricesRequest = null;
      this.setData({ priceFallback: '登录后查看价格' });
    }
  },
  applyRemotePriceLabels() {
    const priceBySku = this._remotePriceBySku || {};
    const products = (this.data.products || PRODUCTS).map((item) => productWithPrice(item, priceBySku, item.specLabel || item.unit));
    const productById = new Map(products.map((item) => [String(item.id), item]));
    const cartItems = (this.data.cartItems || []).map((item) => {
      const price = priceBySku[item.skuId];
      return { ...item, price: hasPriceAmount(price) ? Number(price.amountCent) / 100 : undefined, priceText: priceText(price), priceTemporary: Boolean(hasPriceAmount(price) && price.temporary) };
    });
    const selectedSource = productById.get(String(this.data.selectedProduct && this.data.selectedProduct.id));
    const pricedSelected = selectedSource ? productWithPrice(selectedSource, priceBySku, this.data.selectedSpec) : this.data.selectedProduct;
    const selectedProduct = pricedSelected ? { ...pricedSelected, cartQty: cartQuantityFor(pricedSelected, cartItems, this.data.selectedSpec) } : null;
    const frequent = products.slice(0, 4);
    this.setData({ products, specials: products.slice(0, 8), frequent, frequentHasMultiSku: hasMultiSku(frequent), cartItems, selectedProduct, ...calculateTotals(cartItems), ...selectedCartSummary(cartItems) }, () => this.syncCategory());
  },
  async loadRemoteGroupCampaigns() {
    const result = await groupsApi.campaigns({ page: 1, pageSize: 20 });
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return;
    const products = this.data.products || [];
    const groupDeals = result.data.rows.map((item) => {
      const product = products.find((row) => String(row.id) === String(item.productId));
      return { campaignId: item._id, skuId: item.skuId, productId: item.productId, size: Number(item.groupSize || 0), joined: 0, ends: item.endAt ? item.endAt.replace('T', ' ').slice(0, 16) : '活动进行中', product };
    }).filter((item) => item.product);
    this.setData({ groupDeals });
  },
  findProduct(id) {
    return (this.data.products || PRODUCTS).find((item) => String(item.id) === String(id));
  },
  syncCategory(next = {}, options = {}) {
    const categoryGroup = next.categoryGroup || this.data.categoryGroup;
    const category = next.category || this.data.category;
    const query = next.query === undefined ? this.data.query : next.query;
    const groups = this.data.categoryGroups || CATEGORY_GROUPS;
    const products = this.data.products || PRODUCTS;
    const activeGroup = groups.find(group => group.id === categoryGroup) || groups[0] || null;
    const validCategories = activeGroup ? activeGroup.categories : [];
    const categoryProducts = products.filter(product => (category === '全部' ? validCategories.includes(product.category) : product.category === category) && (!query || product.name.includes(query) || product.category.includes(query)));
    const subCategories = ['全部', ...new Set(IS_CLOUD_MODE ? groups.filter(group => group.id !== '全部').map(group => group.label) : products.map((product) => product.category))];
    const patch = { ...next, categoryGroup, category, query, activeGroup, subCategories, categoryProducts };
    if (!options.resetCatalogScroll) return this.setData(patch);
    this.setData({ ...patch, catalogResultsScrollTop: 1 }, () => this.setData({ catalogResultsScrollTop: 0 }));
  },
  triggerPageMotion(patch, callback) {
    if (this._pageMotionTimer) clearTimeout(this._pageMotionTimer);
    this.setData({ ...patch, pageMotion: true, pageScrollTop: 1 }, () => this.setData({ pageScrollTop: 0 }, callback));
    this._pageMotionTimer = setTimeout(() => {
      this._pageMotionTimer = null;
      this.setData({ pageMotion: false });
    }, 220);
  },
  switchTab(event) {
    const tab = event.currentTarget.dataset.tab;
    if (!tab) return;
    if (tab === this.data.page && !this.data.showAddressForm) return;
    this.triggerPageMotion({ page: tab, activeTab: tab, showAddressForm: false });
    if (tab === 'category') this.syncCategory({ page: tab, activeTab: tab, query: '' });
  },
  openCategory(event) {
    return this.openCategoryByLabel(event.currentTarget.dataset.category);
  },
  openCategoryByLabel(rawLabel) {
    const category = !rawLabel || rawLabel === '全部分类' ? '全部' : rawLabel;
    const groups = this.data.categoryGroups || CATEGORY_GROUPS;
    const group = groups.find(item => item.categories.includes(category)) || groups.find(item => item.id === '全部') || groups[0];
    const patch = { page: 'category', activeTab: 'category', category, categoryGroup: group ? group.id : '全部', query: '' };
    this.triggerPageMotion(patch, () => this.syncCategory(patch));
  },
  selectGroup(event) {
    this.syncCategory({ categoryGroup: event.currentTarget.dataset.group, category: '全部', catalogResultsScrollTop: 1 }, { resetCatalogScroll: true });
  },
  selectCategory(event) {
    const category = event.currentTarget.dataset.category || '全部';
    const groups = this.data.categoryGroups || CATEGORY_GROUPS;
    const group = groups.find(item => item.categories.includes(category)) || groups.find(item => item.id === '全部') || groups[0];
    this.syncCategory({ category, categoryGroup: group.id, catalogResultsScrollTop: 1 }, { resetCatalogScroll: true });
  },
  onSearchInput(event) { this.setData({ query: event.detail.value.trim() }); },
  startSearch() {
    const patch = { page: 'category', activeTab: 'category', categoryGroup: '全部', category: '全部', query: this.data.query };
    this.triggerPageMotion(patch, () => this.syncCategory(patch));
  },

  openProduct(event) {
    return this.openProductById(event.currentTarget.dataset.id);
  },
  openQuantityPicker(event) {
    return this.openQuantityPickerById(event.currentTarget.dataset.id);
  },
  openQuantityPickerById(id) {
    const product = this.findProduct(id);
    if (!product) return;
    if (IS_CLOUD_MODE && !this.data.loggedIn) return this.requireLogin({ type: 'quantityPicker', id, returnPage: this.data.page, activeTab: this.data.activeTab });
    const spec = product.specLabel || (product.specs && product.specs[0]) || product.unit || '';
    const pricedProduct = productWithPrice(product, this._remotePriceBySku || {}, spec);
    this.setData({ quantityPickerVisible: true, quantityPickerProduct: pricedProduct, quantityPickerSpec: spec, quantityPickerQty: 1 });
  },
  closeQuantityPicker() {
    this.setData({ quantityPickerVisible: false, quantityPickerProduct: null, quantityPickerSpec: '', quantityPickerQty: 1 });
  },
  changeQuantityPicker(event) {
    const delta = Number(event.detail && event.detail.delta !== undefined ? event.detail.delta : 0);
    const quantity = Math.max(1, Math.min(99, Number(this.data.quantityPickerQty || 1) + delta));
    this.setData({ quantityPickerQty: quantity });
  },
  selectQuantityPickerSpec(event) {
    const selectedSpec = event.currentTarget.dataset.spec;
    if (!selectedSpec || !this.data.quantityPickerProduct) return;
    const quantityPickerProduct = productWithPrice(this.data.quantityPickerProduct, this._remotePriceBySku || {}, selectedSpec);
    this.setData({ quantityPickerSpec: selectedSpec, quantityPickerProduct });
  },
  openDetailFromQuantityPicker() {
    const product = this.data.quantityPickerProduct;
    if (!product) return this.closeQuantityPicker();
    const quantity = Math.max(1, Math.min(99, Number(this.data.quantityPickerQty || 1)));
    const spec = this.data.quantityPickerSpec || product.specLabel || product.unit;
    this.setData({ quantityPickerVisible: false, quantityPickerProduct: null, quantityPickerSpec: '' }, () => this.openProductById(product.id, { draftQty: quantity, selectedSpec: spec }));
  },
  addQuantityPicker() {
    const product = this.data.quantityPickerProduct;
    if (!product) return this.closeQuantityPicker();
    const quantity = Math.max(1, Math.min(99, Number(this.data.quantityPickerQty || 1)));
    const spec = this.data.quantityPickerSpec || product.specLabel || product.unit;
    if (IS_CLOUD_MODE && !this.data.loggedIn) return this.requireLogin({ type: 'quantityPickerAdd', id: product.id, spec, quantity, returnPage: this.data.page, activeTab: this.data.activeTab });
    return this.addProduct(product.id, spec, () => this.closeQuantityPicker(), quantity);
  },
  openProductById(id, options = {}) {
    const product = this.findProduct(id);
    if (!product) return;
    const draftQty = Math.max(1, Math.min(99, Number(options.draftQty || 1)));
    const selectedSpec = options.selectedSpec && product.specs && product.specs.includes(options.selectedSpec) ? options.selectedSpec : (product.specs ? product.specs[0] : product.unit);
    const detailRequestToken = (this._detailLoadSeq || 0) + 1;
    this._detailLoadSeq = detailRequestToken;
    this.triggerPageMotion({ page: 'detail', selectedProduct: product, selectedGroup: this.data.groupDeals.find(item => item.productId === product.id) || null, selectedSpec, detailDraftQty: draftQty, detailReturnPage: this.data.page, detailImageSrc: product.img || '/assets/products/placeholder.svg', detailImageLoading: true, detailImageError: false, detailVideoSrc: '', detailVideoError: false }, () => this.loadRemoteProductDetail(product, detailRequestToken));
  },
  isCurrentDetailImageEvent(event) {
    const eventSrc = event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.src;
    return !eventSrc || eventSrc === this.data.detailImageSrc;
  },
  handleDetailImageLoad(event) {
    if (!this.isCurrentDetailImageEvent(event)) return;
    this.setData({ detailImageLoading: false, detailImageError: false });
  },
  handleDetailImageError(event) {
    if (!this.isCurrentDetailImageEvent(event)) return;
    this.setData({ detailImageLoading: false, detailImageError: true });
  },
  previewDetailImage() {
    const src = this.data.detailImageSrc;
    if (!src || this.data.detailImageError || typeof wx.previewImage !== 'function') return;
    if (src.indexOf('/assets/products/placeholder.svg') >= 0) return wx.showToast({ title: '商品图片待补充', icon: 'none' });
    wx.previewImage({ current: src, urls: [src] });
  },
  retryDetailImage() {
    const src = (this.data.selectedProduct && this.data.selectedProduct.img) || '/assets/products/placeholder.svg';
    this.setData({ detailImageSrc: '', detailImageLoading: true, detailImageError: false }, () => {
      setTimeout(() => {
        if (this.data.page === 'detail') this.setData({ detailImageSrc: src });
      }, 0);
    });
  },
  handleDetailVideoError() {
    this.setData({ detailVideoSrc: '', detailVideoError: true });
  },
  retryRemoteCatalog() { return this.loadRemoteCatalog(); },
  openHomeSection(event) {
    const sectionType = String(event.currentTarget.dataset.sectionType || '').trim();
    const fallbackType = sectionType === 'news' ? 'activity' : sectionType;
    const section = (this.data.homeSections || []).find((item) => item.moduleType === sectionType);
    if (section && section.jumpType && section.jumpType !== 'none' && this.consumeContentJump(section)) return;
    this.openUtilityByType(fallbackType);
  },
  openBanner(event) {
    const banner = this.data.bannerItems[Number(event.currentTarget.dataset.index)];
    if (!banner || banner.jumpType === 'none' || !this.consumeContentJump(banner)) return;
  },
  consumeContentJump(item) {
    const jumpType = String(item.jumpType || 'none');
    const jumpTarget = String(item.jumpTarget || '').trim();
    if (jumpType === 'product' && jumpTarget) {
      const product = this.findProduct(jumpTarget);
      if (!product) {
        wx.showToast({ title: '该商品暂时不可查看', icon: 'none' });
        return true;
      }
      this.openProductById(product.id);
      return true;
    }
    if (jumpType === 'category' && jumpTarget) {
      this.openCategoryByLabel(jumpTarget);
      return true;
    }
    if (jumpType === 'url' && /^https?:\/\//i.test(jumpTarget)) {
      if (typeof wx !== 'undefined' && typeof wx.setClipboardData === 'function') {
        wx.setClipboardData({ data: jumpTarget, success: () => wx.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' }) });
      } else wx.showToast({ title: '该链接暂时无法打开', icon: 'none' });
      return true;
    }
    return false;
  },
  async loadRemoteProductDetail(product, detailRequestToken) {
    const requestToken = detailRequestToken || ((this._detailLoadSeq || 0) + 1);
    this._detailLoadSeq = requestToken;
    const result = await catalogApi.getProduct(product.id);
    if (!result || !result.ok || !result.data || !result.data.product || !Array.isArray(result.data.skus) || !result.data.skus.length) return;
    if (requestToken !== this._detailLoadSeq || this.data.page !== 'detail' || String(this.data.selectedProduct && this.data.selectedProduct.id) !== String(product.id)) return;
    const remote = result.data.product;
    const skuOptions = result.data.skus.map((sku) => ({ id: sku._id, label: sku.specName || sku.packageUnit || sku.netWeight || '默认规格', packageUnit: sku.packageUnit || '' }));
    const specs = skuOptions.map((sku) => sku.label);
    const videoMedia = (result.data.media || []).find((item) => item && item.mediaType === 'video' && item.mediaAssetId);
    const videoFiles = videoMedia ? await this.resolveMediaFileMap([videoMedia.mediaAssetId]) : {};
    if (requestToken !== this._detailLoadSeq || this.data.page !== 'detail' || String(this.data.selectedProduct && this.data.selectedProduct.id) !== String(product.id)) return;
    const selectedSpec = specs.includes(this.data.selectedSpec) ? this.data.selectedSpec : specs[0];
    const mergedBase = productWithPrice({ ...product, name: remote.name || product.name, category: remote.categoryName || product.category, specs, skuOptions, specLabel: specs[0] || product.specLabel || '', unit: skuOptions[0].packageUnit || product.unit, img: product.img || '/assets/products/placeholder.svg' }, this._remotePriceBySku || {}, selectedSpec);
    const merged = { ...mergedBase, cartQty: cartQuantityFor(mergedBase, this.data.cartItems, selectedSpec) };
    const products = (this.data.products || PRODUCTS).map((item) => String(item.id) === String(product.id) ? merged : item);
    const nextImage = merged.img || '/assets/products/placeholder.svg';
    const imageChanged = nextImage !== this.data.detailImageSrc;
    const resolvedVideoSrc = videoFiles[videoMedia && videoMedia.mediaAssetId] || '';
    this.setData({ products, selectedProduct: merged, selectedSpec: selectedSpec || merged.unit, detailVideoSrc: resolvedVideoSrc, detailVideoError: Boolean(videoMedia && !resolvedVideoSrc), ...(imageChanged ? { detailImageSrc: nextImage, detailImageLoading: true, detailImageError: false } : {}) }, () => this.syncCategory());
  },
  backFromDetail() { this.triggerPageMotion({ page: this.data.detailReturnPage || 'home', activeTab: this.data.detailReturnPage === 'utility' ? this.data.activeTab : this.data.detailReturnPage }); },
  selectSpec(event) {
    const selectedSpec = event.currentTarget.dataset.spec;
    const selectedProduct = productWithPrice(this.data.selectedProduct, this._remotePriceBySku || {}, selectedSpec);
    this.setData({ selectedSpec, selectedProduct: { ...selectedProduct, cartQty: cartQuantityFor(selectedProduct, this.data.cartItems, selectedSpec) } });
  },
  changeDetailQuantity(event) {
    const delta = Number(event.detail && event.detail.delta !== undefined ? event.detail.delta : 0);
    const quantity = Math.max(1, Math.min(99, Number(this.data.detailDraftQty || 1) + delta));
    this.setData({ detailDraftQty: quantity });
  },
  enqueueCartWrite(write) {
    const previous = this._cartWriteQueue || Promise.resolve();
    const next = previous.then(write).catch(() => {
      wx.showToast({ title: '购物车更新失败，请重试', icon: 'none' });
    });
    this._cartWriteQueue = next;
    return next;
  },
  addProduct(id, selectedSpec, onComplete, requestedQuantity = 1) {
    const feedbackId = String(id);
    const feedbackToken = (this._cartFeedbackSeq || 0) + 1;
    this._cartFeedbackSeq = feedbackToken;
    this.setData({ cartFeedbackId: feedbackId });
    return this.enqueueCartWrite(async () => {
      try {
        return await this.applyAddProduct(id, selectedSpec, onComplete, requestedQuantity);
      } finally {
        if (this._cartFeedbackSeq === feedbackToken) this.setData({ cartFeedbackId: '' });
      }
    });
  },
  async applyAddProduct(id, selectedSpec, onComplete, requestedQuantity = 1) {
    const baseProduct = this.findProduct(id);
    if (!baseProduct) return;
    let spec = selectedSpec || baseProduct.specLabel || baseProduct.unit;
    const product = serviceConfig.provider === 'cloudbase'
      ? productWithPrice(baseProduct, this._remotePriceBySku || {}, spec)
      : baseProduct;
    let resolvedSkuId = '';
    if (serviceConfig.provider === 'cloudbase' && Array.isArray(product.skuOptions) && product.skuOptions.length) {
      // 请求的规格在最新目录中必须真实存在；仅单规格商品允许缺省回退，绝不静默换成其他规格
      const exact = product.skuOptions.find((item) => item.label === spec);
      const option = exact || (product.skuOptions.length === 1 ? product.skuOptions[0] : null);
      if (!option) return wx.showToast({ title: '所选规格暂不可用，请重新选择', icon: 'none' });
      resolvedSkuId = option.id;
      if (!exact) spec = option.label;
    }
    const cartItems = this.data.cartItems.map(item => ({ ...item }));
    let existing = cartItems.find(item => String(item.id) === String(product.id) && item.selectedSpec === spec);
    const addQuantity = Math.max(1, Math.min(99, Number(requestedQuantity || 1)));
    let quantity = (existing ? existing.qty : 0) + addQuantity;
    let skuId = (existing && existing.skuId) || resolvedSkuId;
    if (serviceConfig.provider === 'cloudbase') {
      if (!skuId) {
        const detail = await catalogApi.getProduct(product.id);
        const remoteSkus = detail && detail.ok && detail.data && Array.isArray(detail.data.skus) ? detail.data.skus : [];
        const exactRemote = remoteSkus.find((item) => (item.specName || item.packageUnit || item.netWeight) === spec);
        const option = exactRemote || (remoteSkus.length === 1 ? remoteSkus[0] : null);
        if (!option) return wx.showToast({ title: '商品规格暂不可用', icon: 'none' });
        skuId = option._id;
        if (!exactRemote) spec = option.specName || option.packageUnit || option.netWeight || spec;
        existing = cartItems.find(item => String(item.id) === String(product.id) && item.selectedSpec === spec);
        quantity = (existing ? existing.qty : 0) + addQuantity;
      }
      if (!skuId) return wx.showToast({ title: '商品规格暂不可用', icon: 'none' });
      const cartKey = String(skuId) + '::' + String(spec);
      let effectiveSelected = this._pendingSelectionFor && this._pendingSelectionFor.has(cartKey) ? this._pendingSelectionFor.get(cartKey) : true;
      const saved = await cartApi.addItem({ skuId, quantity, selected: effectiveSelected });
      if (!saved || !saved.ok || !saved.data || !saved.data.item) return wx.showToast({ title: saved && saved.error && saved.error.message || '加入购物车失败', icon: 'none' });
      // 加购飞行期间用户可能再次改勾选：以映射中的最新意图为准；映射删除后由行数据承载，勾选自身的写入会收敛服务端
      const latestPending = this._pendingSelectionFor && this._pendingSelectionFor.has(cartKey) ? this._pendingSelectionFor.get(cartKey) : undefined;
      if (latestPending !== undefined) effectiveSelected = latestPending;
      if (this._pendingSelectionFor) this._pendingSelectionFor.delete(cartKey);
      if (existing) { existing.qty = quantity; existing.skuId = skuId; existing.remoteCartItemId = saved.data.item._id; existing.selected = effectiveSelected; }
      else cartItems.push({ ...product, skuId, remoteCartItemId: saved.data.item._id, selectedSpec: spec, qty: quantity, selected: effectiveSelected });
    } else if (existing) { existing.qty = quantity; existing.selected = true; }
    else cartItems.push({ ...product, selectedSpec: spec, qty: addQuantity });
    this.syncCart(cartItems, () => {
      this.pulseCartBadge();
      wx.showToast({ title: '已加入购物车', icon: 'success', duration: 900 });
      if (typeof onComplete === 'function') onComplete();
    });
  },
  addFromList(event) {
    const id = event.currentTarget.dataset.id;
    if (IS_CLOUD_MODE && !this.data.loggedIn) return this.requireLogin({ type: 'addProduct', id, spec: event.currentTarget.dataset.spec || '', returnPage: this.data.page, activeTab: this.data.activeTab });
    return this.addProduct(id, event.currentTarget.dataset.spec || '');
  },
  addSelected() {
    if (!this.data.selectedProduct) return;
    const { id } = this.data.selectedProduct;
    const quantity = Math.max(1, Number(this.data.detailDraftQty || 1));
    if (IS_CLOUD_MODE && !this.data.loggedIn) return this.requireLogin({ type: 'addProduct', id, spec: this.data.selectedSpec, quantity, returnPage: 'detail', activeTab: this.data.activeTab });
    return this.addProduct(id, this.data.selectedSpec, undefined, quantity);
  },
  addFrequent() {
    const multiSku = (this.data.frequent || []).find((product) => product && product.specs && product.specs.length > 1);
    if (multiSku) return wx.showToast({ title: '请逐个选择数量和规格', icon: 'none' });
    if (IS_CLOUD_MODE && !this.data.loggedIn) return this.requireLogin({ type: 'addFrequent', returnPage: this.data.page, activeTab: this.data.activeTab });
    return this.enqueueCartWrite(() => this.applyAddFrequent());
  },
  async applyAddFrequent() {
    const multiSku = (this.data.frequent || []).find((product) => product && product.specs && product.specs.length > 1);
    if (multiSku) return wx.showToast({ title: '请逐个选择数量和规格', icon: 'none' });
    if (serviceConfig.provider === 'cloudbase') {
      const cartItems = this.data.cartItems.map(item => ({ ...item }));
      const frequent = this.data.frequent || [];
      let added = 0;
      for (const product of frequent) {
        if (!product || !product.id) continue;
        let skuId = product.skuId;
        if (!skuId && Array.isArray(product.skuOptions)) {
          const option = product.skuOptions.find((item) => item.id) || product.skuOptions[0];
          skuId = option && option.id;
        }
        let spec = product.specLabel || product.unit || '默认规格';
        if (!skuId) {
          const detail = await catalogApi.getProduct(product.id);
          const remoteSkus = detail && detail.ok && detail.data && Array.isArray(detail.data.skus) ? detail.data.skus : [];
          const option = remoteSkus.find((item) => (item.specName || item.packageUnit || item.netWeight) === spec) || remoteSkus[0];
          if (!option) continue;
          skuId = option._id;
          spec = option.specName || option.packageUnit || option.netWeight || spec;
        }
        if (!skuId) continue;
        const existingIndex = cartItems.findIndex((item) => String(item.id) === String(product.id) && item.selectedSpec === spec);
        const quantity = (existingIndex >= 0 ? cartItems[existingIndex].qty : 0) + 1;
        const saved = await cartApi.addItem({ skuId, quantity, selected: true });
        if (!saved || !saved.ok || !saved.data || !saved.data.item) {
          wx.showToast({ title: saved && saved.error && saved.error.message || '常购商品加入购物车失败', icon: 'none' });
          continue;
        }
        if (existingIndex >= 0) {
          cartItems[existingIndex].qty = quantity;
          cartItems[existingIndex].skuId = skuId;
          cartItems[existingIndex].remoteCartItemId = saved.data.item._id;
        } else {
          cartItems.push({ ...product, skuId, remoteCartItemId: saved.data.item._id, selectedSpec: spec, qty: quantity });
        }
        added += 1;
        this.syncCart(cartItems);
      }
      this.syncCart(cartItems);
      if (added) this.pulseCartBadge();
      wx.showToast({ title: added ? '常购商品已加入购物车' : '暂无可以加购的常购商品', icon: added ? 'success' : 'none', duration: 900 });
      return;
    }
    const cartItems = this.data.cartItems.map(item => ({ ...item }));
    this.data.frequent.forEach(product => {
      const defaultSpec = product.specLabel || product.unit;
      const existing = cartItems.find(item => item.id === product.id && item.selectedSpec === defaultSpec);
      if (existing) existing.qty += 1;
      else cartItems.push({ ...product, selectedSpec: defaultSpec, qty: 1 });
    });
    this.syncCart(cartItems);
    this.pulseCartBadge();
    wx.showToast({ title: '常购商品已加入购物车', icon: 'success', duration: 900 });
  },
  joinGroup(event) {
    const productId = String(event.currentTarget.dataset.productId);
    const deal = this.data.groupDeals.find(item => String(item.productId) === productId);
    if (!deal || deal.joined >= deal.size) return wx.showToast({ title: '该团已成团', icon: 'none' });
    if (this.requireLogin({ type: 'group' })) return;
    if (serviceConfig.provider === 'cloudbase') {
      return wx.showModal({ title: '拼团支付', content: '拼团需要服务端报价、库存预占和微信支付确认。当前支付通道尚未配置，暂不能提交参团订单。', showCancel: false });
    }
    const groupDeals = this.data.groupDeals.map(item => String(item.productId) === productId ? { ...item, joined: item.joined + 1 } : item);
    const selectedGroup = this.data.selectedGroup && String(this.data.selectedGroup.productId) === productId ? groupDeals.find(item => String(item.productId) === productId) : this.data.selectedGroup;
    this.setData({ groupDeals, selectedGroup });
    wx.showToast({ title: deal.joined + 1 >= deal.size ? '拼团成功' : '已参与拼团', icon: 'success' });
  },
  syncCart(cartItems, onComplete) {
    // 用户刚做出的勾选变更在对应服务端写入完成前，不允许被队列中更早任务的旧快照回滚
    if (this._pendingSelectionFor && this._pendingSelectionFor.size) {
      cartItems = cartItems.map((item) => {
        const key = String(item.skuId || item.remoteCartItemId || item.id) + '::' + String(item.selectedSpec || item.specLabel || item.unit || '');
        return this._pendingSelectionFor.has(key) ? { ...item, selected: this._pendingSelectionFor.get(key) } : item;
      });
    }
    const normalizedCartItems = cartItems.map((item) => ({
      ...item,
      cartKey: String(item.skuId || item.remoteCartItemId || item.id) + '::' + String(item.selectedSpec || item.specLabel || item.unit || '')
    }));
    const cartCount = normalizedCartItems.reduce((sum, item) => sum + item.qty, 0);
    const totals = calculateTotals(normalizedCartItems);
    const selectedTotals = selectedCartSummary(normalizedCartItems);
    const products = (this.data.products || PRODUCTS).map((item) => ({ ...item, cartQty: cartQuantityFor(item, normalizedCartItems) }));
    const productById = new Map(products.map((item) => [String(item.id), item]));
    const specials = (this.data.specials || []).map((item) => productById.get(String(item.id)) || { ...item, cartQty: cartQuantityFor(item, cartItems) });
    const frequent = (this.data.frequent || []).map((item) => productById.get(String(item.id)) || { ...item, cartQty: cartQuantityFor(item, cartItems) });
    const selectedBase = productById.get(String(this.data.selectedProduct && this.data.selectedProduct.id)) || this.data.selectedProduct;
    const selectedPriced = selectedBase ? productWithPrice(selectedBase, this._remotePriceBySku || {}, this.data.selectedSpec) : null;
    const selectedProduct = selectedPriced ? { ...selectedPriced, cartQty: cartQuantityFor(selectedPriced, normalizedCartItems, this.data.selectedSpec) } : null;
    this.setData({ cartItems: normalizedCartItems, cartCount, products, specials, frequent, frequentHasMultiSku: hasMultiSku(frequent), selectedProduct, ...totals, ...selectedTotals }, () => {
      this.syncCategory();
      if (typeof onComplete === 'function') onComplete();
    });
  },
  pulseCartBadge() {
    if (this._cartPulseTimer) clearTimeout(this._cartPulseTimer);
    this.setData({ cartPulse: true });
    this._cartPulseTimer = setTimeout(() => {
      this._cartPulseTimer = null;
      this.setData({ cartPulse: false });
    }, 240);
  },
  changeQuantity(event) {
    const dataset = { ...event.currentTarget.dataset, delta: event.detail && event.detail.delta !== undefined ? event.detail.delta : event.currentTarget.dataset.delta };
    if (IS_CLOUD_MODE && !this.data.loggedIn && Number(dataset.delta) > 0) return this.requireLogin({ type: 'addProduct', id: dataset.id, spec: dataset.spec || '', returnPage: this.data.page, activeTab: this.data.activeTab });
    return this.enqueueCartWrite(() => this.applyChangeQuantity({ currentTarget: { dataset } }));
  },
  toggleCartSelection(event) {
    const dataset = event.currentTarget.dataset || {};
    const item = this.data.cartItems.find((entry) => {
      const sameSku = dataset.skuId ? String(entry.skuId) === String(dataset.skuId) : String(entry.id) === String(dataset.id);
      const sameSpec = dataset.spec ? String(entry.selectedSpec || '') === String(dataset.spec) : true;
      return sameSku && sameSpec;
    });
    if (!item) return;
    const selected = Boolean(event.detail && event.detail.value && event.detail.value.length);
    const itemKey = item.cartKey || (String(item.skuId || item.remoteCartItemId || item.id) + '::' + String(item.selectedSpec || ''));
    const previousCartItems = this.data.cartItems.map((entry) => ({ ...entry }));
    const nextCartItems = this.data.cartItems.map((entry) => (entry.cartKey || (String(entry.skuId || entry.remoteCartItemId || entry.id) + '::' + String(entry.selectedSpec || ''))) === itemKey ? { ...entry, selected } : { ...entry });
    const selectionToken = (this._cartSelectionSeq || 0) + 1;
    this._cartSelectionSeq = selectionToken;
    if (!this._pendingSelectionFor) this._pendingSelectionFor = new Map();
    this._pendingSelectionFor.set(itemKey, selected);
    this.syncCart(nextCartItems);
    if (serviceConfig.provider === 'cloudbase' && item.skuId) {
      return this.enqueueCartWrite(async () => {
        // 勾选只改选中态：数量必须在写入执行时重读最新值，不得用点击时刻的旧快照覆盖服务端数量
        const latest = this.data.cartItems.find((entry) => (entry.cartKey || (String(entry.skuId || entry.remoteCartItemId || entry.id) + '::' + String(entry.selectedSpec || ''))) === itemKey);
        const result = await cartApi.updateItem({ skuId: item.skuId, quantity: latest ? latest.qty : item.qty, selected });
        this._pendingSelectionFor.delete(itemKey);
        if (!result || !result.ok) {
          if (this._cartSelectionSeq === selectionToken) this.syncCart(previousCartItems);
          return wx.showToast({ title: result && result.error && result.error.message || '购物车选择更新失败', icon: 'none' });
        }
      });
    }
  },
  async applyChangeQuantity(event) {
    const { id, spec, delta } = event.currentTarget.dataset;
    const current = this.data.cartItems.find(item => String(item.id) === String(id) && item.selectedSpec === spec);
    if (!current) return Number(delta) > 0 ? this.applyAddProduct(id, spec) : undefined;
    const quantity = current.qty + Number(delta);
    if (serviceConfig.provider === 'cloudbase' && current.skuId) {
      const result = quantity > 0 ? await cartApi.updateItem({ skuId: current.skuId, quantity, selected: current.selected !== false }) : (current.remoteCartItemId ? await cartApi.removeItem(current.remoteCartItemId) : { ok: true });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '购物车更新失败', icon: 'none' });
    }
    const cartItems = this.data.cartItems.map(item => String(item.id) === String(id) && item.selectedSpec === spec ? { ...item, qty: quantity } : { ...item }).filter(item => item.qty > 0);
    this.syncCart(cartItems);
  },
  clearCart() {
    wx.showModal({ title: '清空购物车', content: '清空后需要重新添加商品，是否继续？', confirmText: '清空', confirmColor: '#e65353', success: async result => {
      if (!result.confirm) return;
      if (serviceConfig.provider === 'cloudbase') {
        // 清空必须排队执行：与飞行中的加购/改数量串行，避免"清空后商品复活"
        return this.enqueueCartWrite(async () => {
          const remoteItems = this.data.cartItems.filter((item) => item.remoteCartItemId);
          const removed = await Promise.all(remoteItems.map((item) => cartApi.removeItem(item.remoteCartItemId)));
          if (removed.some((item) => !item || !item.ok)) return wx.showToast({ title: '购物车清空失败，请稍后重试', icon: 'none' });
          if (this._pendingSelectionFor) this._pendingSelectionFor.clear();
          this.syncCart([]);
          wx.showToast({ title: '购物车已清空', icon: 'none' });
        });
      }
      this.syncCart([]);
      wx.showToast({ title: '购物车已清空', icon: 'none' });
    }});
  },

  requireLogin(continuation) {
    if (this.data.loggedIn) return false;
    if (this._loginCloseTimer) { clearTimeout(this._loginCloseTimer); this._loginCloseTimer = null; }
    this._loginContinuation = continuation || '';
    this.setData({ showLogin: true, loginMounted: true, loginVisible: false, agreed: false }, () => {
      this.setData({ loginVisible: true });
    });
    return true;
  },
  openLogin() { this.requireLogin({ type: 'mine' }); },
  closeLogin(event) {
    const isCloseButton = event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.close;
    if (event && event.target && event.target.id !== 'login-mask' && !isCloseButton) return;
    this.dismissLogin();
  },
  dismissLogin(onComplete) {
    if (!this.data.loginMounted) { if (typeof onComplete === 'function') onComplete(); return; }
    if (this._loginCloseTimer) clearTimeout(this._loginCloseTimer);
    this.setData({ showLogin: false, loginVisible: false });
    this._loginCloseTimer = setTimeout(() => {
      this._loginCloseTimer = null;
      this.setData({ loginMounted: false }, onComplete);
    }, 220);
  },
  preventClose() {},
  changeAgreement(event) { this.setData({ agreed: event.detail.value.includes('agree') }); },
  openPolicyFromLogin() {
    this.dismissLogin(() => this.openUtilityByType('policy'));
  },
  async completeLogin(event) {
    if (!this.data.agreed) return wx.showToast({ title: '请先同意服务协议与隐私政策', icon: 'none' });
    if (event && event.detail && event.detail.errMsg && event.detail.errMsg !== 'getPhoneNumber:ok') return wx.showToast({ title: '未完成手机号授权', icon: 'none' });
    if (serviceConfig.provider === 'cloudbase') {
      const result = await authApi.login();
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '微信登录失败，请稍后重试', icon: 'none' });
      const user = result.data && result.data.user;
      this._remoteUser = user || null;
      await this.loadRemoteCatalogPrices();
      await this.loadRemoteAddress();
      await this.loadRemoteCart();
      await this.loadRemoteOrders();
    }
    const user = this._remoteUser || null;
    const profile = identityProfile(user);
    const patch = {
      loggedIn: true,
      userType: user && user.userType || (serviceConfig.provider === 'cloudbase' ? '' : 'c'),
      businessStatus: user && user.businessStatus || '',
      profileTitle: profile.profileTitle,
      profileSub: profile.profileSub
    };
    const continuation = this._loginContinuation; this._loginContinuation = ''; this.setData(patch);
    if (serviceConfig.provider === 'cloudbase' && typeof wx !== 'undefined' && typeof wx.setStorageSync === 'function') wx.setStorageSync(LOGIN_AGREED_STORAGE_KEY, '1');
    this.dismissLogin(() => {
      if (continuation && continuation.type === 'checkout') {
        return this.goCheckout();
      }
      if (continuation && continuation.type === 'addProduct') {
        return this.setData({ page: continuation.returnPage || this.data.page, activeTab: continuation.activeTab || this.data.activeTab, detailDraftQty: Math.max(1, Number(continuation.quantity || 1)) }, () => this.addProduct(continuation.id, continuation.spec, undefined, continuation.quantity));
      }
      if (continuation && continuation.type === 'quantityPicker') {
        return this.setData({ page: continuation.returnPage || this.data.page, activeTab: continuation.activeTab || this.data.activeTab }, () => this.openQuantityPickerById(continuation.id));
      }
      if (continuation && continuation.type === 'quantityPickerAdd') {
        return this.setData({ page: continuation.returnPage || this.data.page, activeTab: continuation.activeTab || this.data.activeTab }, () => this.addProduct(continuation.id, continuation.spec, () => this.closeQuantityPicker(), continuation.quantity));
      }
      if (continuation && continuation.type === 'detailCheckout') {
        return this.setData({ page: 'detail', activeTab: continuation.activeTab || this.data.activeTab, detailDraftQty: Math.max(1, Number(continuation.quantity || 1)) }, () => this.addProduct(continuation.id, continuation.spec, () => this.goCheckout(), continuation.quantity));
      }
      if (continuation && continuation.type === 'addFrequent') {
        return this.setData({ page: continuation.returnPage || this.data.page, activeTab: continuation.activeTab || this.data.activeTab }, () => this.addFrequent());
      }
      if (continuation && continuation.type === 'mine') { this.setData({ page: 'mine', activeTab: 'mine' }); wx.showToast({ title: '登录成功', icon: 'success' }); return; }
      if (continuation && continuation.type) { this.openUtilityByType(continuation.type, continuation.filter); wx.showToast({ title: '登录成功', icon: 'success' }); return; }
      this.setData({ page: 'mine', activeTab: 'mine' }); wx.showToast({ title: '登录成功', icon: 'success' });
    });
  },
  async restoreRemoteSession() {
    if (!IS_CLOUD_MODE || typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function' || !wx.getStorageSync(LOGIN_AGREED_STORAGE_KEY)) return;
    const result = await authApi.getMe();
    if (!result || !result.ok || !result.data || !result.data.user) return;
    const user = result.data.user;
    const profile = identityProfile(user);
    this._remoteUser = user;
    this.setData({
      loggedIn: true,
      userType: user.userType || '',
      businessStatus: user.businessStatus || '',
      profileTitle: profile.profileTitle,
      profileSub: profile.profileSub
    });
    // 目录加载先于登录恢复完成时：目录尾部会标记等待登录，这里补一次价格加载
    await this.loadRemoteCatalogPrices();
    if (this._pricesWaitingLogin) {
      this._pricesWaitingLogin = false;
      await this.loadRemoteCatalogPrices();
    }
    await this.loadRemoteAddress();
    await this.loadRemoteCart();
    await this.loadRemoteOrders();
  },
  confirmAction(options, onConfirm) {
    if (typeof wx === 'undefined' || typeof wx.showModal !== 'function') return onConfirm();
    wx.showModal({ ...options, success: (result) => { if (result.confirm) onConfirm(); } });
  },
  logout() {
    this.confirmAction({ title: '退出登录', content: '退出后需要重新登录才能查看购物车和订单。', confirmText: '退出', confirmColor: '#e65353' }, () => this.performLogout());
  },
  performLogout() {
    const patch = { loggedIn: false, page: 'mine', activeTab: 'mine' };
    if (IS_CLOUD_MODE) {
      patch.cartItems = [];
      patch.cartCount = 0;
      patch.orderRows = [];
      patch.allOrderRows = [];
      patch.lastOrder = null;
      patch.orderEmptyTitle = '暂无订单记录';
      patch.orderEmptyHint = '下单后会在这里显示订单状态和预计送达时间';
      patch.address = { ...EMPTY_ADDRESS };
      patch.couponCount = 0;
      patch.points = 0;
      patch.checkedIn = false;
      patch.userType = '';
      patch.businessStatus = '';
      patch.profileTitle = '梦食鲜顾客';
      patch.profileSub = '微信用户 · 普通会员';
    }
    this._remoteUser = null;
    this._remotePriceBySku = {};
    if (IS_CLOUD_MODE && typeof wx !== 'undefined' && typeof wx.removeStorageSync === 'function') wx.removeStorageSync(LOGIN_AGREED_STORAGE_KEY);
    this.setData(patch, () => this.applyRemotePriceLabels());
    this._remoteOrderKey = '';
    this._submittingRemoteOrder = false;
    wx.showToast({ title: '已退出登录', icon: 'none' });
  },
  openBusinessApplication() {
    if (!this.data.loggedIn) return this.requireLogin({ type: 'businessApplication' });
    this.openUtilityByType('businessApplication');
  },
  async submitBusinessApplication(event) {
    if (this.data.businessSubmitting || this._businessSubmitting) return;
    const value = event.detail && event.detail.value || {};
    const companyName = String(value.companyName || '').trim();
    const unifiedCode = String(value.unifiedCode || '').trim();
    const contactName = String(value.contactName || '').trim();
    const contactPhone = String(value.contactPhone || '').trim();
    if (!companyName || !unifiedCode || !contactName || !/^1\d{10}$/.test(contactPhone)) return wx.showToast({ title: '请填写完整企业申请信息', icon: 'none' });
    this._businessSubmitting = true;
    this.setData({ businessSubmitting: true });
    const result = await authApi.applyBusiness({ companyName, unifiedCode, contactName, contactPhone });
    this._businessSubmitting = false;
    if (!result || !result.ok || !result.data || !result.data.application) {
      this.setData({ businessSubmitting: false });
      return wx.showToast({ title: result && result.error && result.error.message || '企业申请提交失败', icon: 'none' });
    }
    this._remoteUser = { ...(this._remoteUser || {}), businessStatus: 'pending' };
    const profile = identityProfile(this._remoteUser);
    this.setData({ businessStatus: 'pending', businessSubmitting: false, profileTitle: profile.profileTitle, profileSub: profile.profileSub });
    wx.showToast({ title: '企业申请已提交', icon: 'success' });
  },

  async loadRemoteAddress() {
    const result = await addressApi.list();
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return;
    if (!result.data.rows.length) {
      if (IS_CLOUD_MODE) this.setData({ address: { ...EMPTY_ADDRESS } });
      return;
    }
    const remote = result.data.rows.find((item) => item.isDefault) || result.data.rows[0];
    this.setData({ address: { id: remote._id, name: customerAddressText(remote.name, '收货人'), phone: '', masked: remote.phoneMasked || '', detail: customerAddressText(remote.detail, '已保存的收货地址'), regionCode: remote.regionCode || '' } });
  },

  async loadRemoteCart() {
    const pendingWrite = this._cartWriteQueue;
    if (pendingWrite) await pendingWrite.catch(() => null);
    const result = await cartApi.getAll();
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return;
    const remoteItems = result.data.rows.filter((item) => item.sku && item.product && !item.unavailable).map((item) => {
      const categoryName = item.product.categoryName || '其他冻品';
      const catalogProduct = (this.data.products || []).find((product) => String(product.id) === String(item.product._id));
      return {
      id: item.product._id,
      name: item.product.name || '未命名商品',
      category: categoryName,
      unit: item.sku.packageUnit || item.sku.netWeight || '规格待补充',
      selectedSpec: item.sku.specName || item.sku.packageUnit || item.sku.netWeight || '默认规格',
      skuId: item.skuId,
      remoteCartItemId: item._id,
      selected: item.selected !== false,
      qty: item.quantity,
      tag: '待补充',
      img: catalogProduct && catalogProduct.img || item.product.image || item.product.coverUrl || '/assets/products/placeholder.svg',
      benefit: '冷链配送 · 家庭囤货',
      price: hasPriceAmount(this._remotePriceBySku && this._remotePriceBySku[item.skuId]) ? Number(this._remotePriceBySku[item.skuId].amountCent) / 100 : undefined,
      priceText: priceText(this._remotePriceBySku && this._remotePriceBySku[item.skuId]),
      priceTemporary: Boolean(hasPriceAmount(this._remotePriceBySku && this._remotePriceBySku[item.skuId]) && this._remotePriceBySku[item.skuId].temporary)
      };
    });
    // 临时图片 URL 会过期：购物车渲染前按最新 coverMediaId 重新解析临时链接
    const coverIds = [...new Set(remoteItems.map((item) => item.product && item.product.coverMediaId).filter(Boolean))];
    if (coverIds.length) {
      const fileMap = await this.resolveMediaFileMap(coverIds);
      for (const item of remoteItems) {
        const url = item.product && item.product.coverMediaId && fileMap[item.product.coverMediaId];
        if (url) item.img = url;
      }
    }
    this.syncCart(remoteItems);
  },

  async loadRemoteOrders() {
    const result = await ordersApi.list({ page: 1, pageSize: 20 });
    if (!result || !result.ok || !result.data || !Array.isArray(result.data.rows)) return;
    const rows = result.data.rows;
    if (!rows.length) {
      if (IS_CLOUD_MODE) this.applyOrderRows([]);
      return;
    }
    const allRows = rows.map((order) => toOrderRow(order));
    this.applyOrderRows(allRows);
  },
  applyOrderRows(allRows) {
    const filter = this.data.orderFilter || '全部订单';
    const source = Array.isArray(allRows) ? allRows : [];
    const orderRows = source.filter((row) => orderMatchesFilter(row, filter));
    this.setData({ allOrderRows: source, orderRows, lastOrder: orderRows[0] || null, orderEmptyTitle: orderEmptyCopy(filter, 'title'), orderEmptyHint: orderEmptyCopy(filter, 'hint') });
  },

  async runRemoteOrderAction(id, action) {
    if (!id || this.data.orderActionBusyId) return;
    this.setData({ orderActionBusyId: id });
    try { await action(); } finally { this.setData({ orderActionBusyId: '' }); }
  },

  confirmRemoteOrder(event) {
    const id = event.currentTarget.dataset.id;
    return this.confirmAction({ title: '确认收货', content: '确认后订单将完成，请确认商品已经收到。', confirmText: '确认收货' }, () => this.runRemoteOrderAction(id, async () => {
      const result = await ordersApi.confirm({ id });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '确认收货失败，请稍后重试', icon: 'none' });
      await this.loadRemoteOrders();
      wx.showToast({ title: '已确认收货', icon: 'success' });
    }));
  },

  cancelRemoteOrder(event) {
    const id = event.currentTarget.dataset.id;
    return this.confirmAction({ title: '取消订单', content: '取消后本次订单将不能恢复，确定取消吗？', confirmText: '取消订单', confirmColor: '#e65353' }, () => this.runRemoteOrderAction(id, async () => {
      const result = await ordersApi.cancel({ id });
      if (!result || !result.ok) return wx.showToast({ title: result && result.error && result.error.message || '订单取消失败，请稍后重试', icon: 'none' });
      await this.loadRemoteOrders();
      wx.showToast({ title: '订单已取消', icon: 'success' });
    }));
  },

  requestRemoteRefund(event) {
    const item = (this.data.orderRows || []).find((row) => row.id === event.currentTarget.dataset.id);
    if (!item) return;
    return this.confirmAction({ title: '申请售后', content: '将提交售后申请，确认商品确实需要售后吗？', confirmText: '提交申请' }, () => this.submitRemoteRefund(item));
  },
  async submitRemoteRefund(item) {
    if (this._refundSubmitting && this._refundSubmitting[item.id]) return;
    this._refundSubmitting = this._refundSubmitting || {};
    if (this.data.orderActionBusyId) return;
    this.setData({ orderActionBusyId: item.id });
    this._refundSubmitting[item.id] = true;
    try {
      this._refundKeyMap = this._refundKeyMap || {};
      const key = this._refundKeyMap[item.id] || `mini-refund-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      this._refundKeyMap[item.id] = key;
      const result = await refundsApi.request({ orderId: item.id, idempotencyKey: key, amountCent: item.totalAmountCent, reason: '客户申请售后' });
      if (!result || !result.ok) {
        const code = result && result.error && result.error.code;
        if (code !== 'REQUEST_FAILED') delete this._refundKeyMap[item.id];
        return wx.showToast({ title: result && result.error && result.error.message || '售后申请失败', icon: 'none' });
      }
      delete this._refundKeyMap[item.id];
      await this.loadRemoteOrders();
      wx.showToast({ title: '售后申请已提交', icon: 'success' });
    } finally {
      delete this._refundSubmitting[item.id];
      this.setData({ orderActionBusyId: '' });
    }
  },

  goCheckout() {
    if (!this.data.cartItems.length) return wx.showToast({ title: '请先添加商品再结算', icon: 'none' });
    if (!this.data.selectedCartCount) return wx.showToast({ title: '请先选择要结算的商品', icon: 'none' });
    if (this.requireLogin({ type: 'checkout', returnPage: this.data.page, activeTab: this.data.activeTab })) return;
    // 交易链路已迁入独立分包。只传递页面意图，购物车、地址、报价和金额均由分包重新从服务端读取。
    wx.navigateTo({ url: '/package-trade/pages/checkout/index' });
  },
  async loadRemoteQuote() {
    // 请求序号保护：连续触发报价（切地址/重进结算）时丢弃过期响应，与分包口径一致
    const requestToken = (this._checkoutQuoteRequestSeq || 0) + 1;
    this._checkoutQuoteRequestSeq = requestToken;
    const address = this.data.address || {};
    const warehouse = this.data.warehouse || {};
    const items = selectedCartItems(this.data.cartItems || []).filter((item) => item.skuId).map((item) => ({ skuId: item.skuId, quantity: item.qty }));
    if (serviceConfig.provider !== 'cloudbase') {
      if (requestToken !== this._checkoutQuoteRequestSeq) return;
      return this.setData({ checkoutQuoteState: 'ready' });
    }
    if (!address.id || !warehouse.id || !items.length) {
      if (requestToken !== this._checkoutQuoteRequestSeq) return;
      return this.setData({ checkoutQuoteState: 'invalid' });
    }
    const result = await checkoutApi.quote({ addressId: address.id, warehouseId: warehouse.id, items });
    if (requestToken !== this._checkoutQuoteRequestSeq) return;
    if (!result || !result.ok || !result.data || !result.data.quote) return this.setData({ checkoutQuoteState: 'error' });
    const quote = result.data.quote;
    const payableAmountCent = quote.payableAmountCent !== undefined ? quote.payableAmountCent : quote.totalAmountCent;
    if (requestToken !== this._checkoutQuoteRequestSeq) return;
    this.setData({ cartTotal: money(Number(quote.goodsAmountCent || 0) / 100), freightTotal: money(Number(quote.freightAmountCent || 0) / 100), orderTotal: money(Number(payableAmountCent || 0) / 100), checkoutQuoteState: 'ready' });
  },
  async placeRemoteOrder() {
    if (this._submittingRemoteOrder) return;
    this._submittingRemoteOrder = true;
    try {
      const address = this.data.address || {};
      const warehouse = this.data.warehouse || {};
      const purchasedCartItems = selectedCartItems(this.data.cartItems || []);
      const items = purchasedCartItems.filter((item) => item.skuId).map((item) => ({ skuId: item.skuId, quantity: item.qty }));
      if (!address.id || !warehouse.id || items.length !== purchasedCartItems.length) return wx.showToast({ title: '请先完成商品规格和收货地址配置', icon: 'none' });
      const me = await authApi.getMe();
      if (!me || !me.ok || !me.data || !me.data.user) return wx.showToast({ title: '登录状态已失效，请重新登录', icon: 'none' });
      const isBusiness = me.data.user.userType === 'b' && me.data.user.businessStatus === 'approved';
      if (!this._remoteOrderKey) this._remoteOrderKey = `mini-demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const summary = purchasedCartItems.slice(0, 2).map((item) => item.name).join('、') + (purchasedCartItems.length > 2 ? ` 等 ${purchasedCartItems.length} 件商品` : '');
      const result = await checkoutApi.createOrder({ idempotencyKey: this._remoteOrderKey, addressId: address.id, warehouseId: warehouse.id, items, paymentMethod: isBusiness ? 'offline' : 'demo' });
      if (!result || !result.ok || !result.data || !result.data.order) return wx.showToast({ title: result && result.error && result.error.message || '订单创建失败，请稍后重试', icon: 'none' });
      const order = result.data.order;
      this._remoteOrderKey = '';
      const lastOrder = toOrderRow(order, { summary, deliveryTime: this.data.warehouse.eta });
      const remoteCartItems = purchasedCartItems.filter((item) => item.remoteCartItemId);
      const removed = await Promise.all(remoteCartItems.map((item) => cartApi.removeItem(item.remoteCartItemId)));
      if (removed.some((item) => !item || !item.ok)) {
        await this.loadRemoteCart();
        wx.showToast({ title: '订单已创建，购物车同步失败', icon: 'none' });
      } else {
        // 按 cartKey 集合过滤：跨 await 期间数据被整体替换时对象引用比较会失效
        const purchasedKeys = new Set(purchasedCartItems.map((item) => item.cartKey || (String(item.skuId || item.remoteCartItemId || item.id) + '::' + String(item.selectedSpec || item.specLabel || item.unit || ''))));
        this.syncCart(this.data.cartItems.filter((item) => {
          const key = item.cartKey || (String(item.skuId || item.remoteCartItemId || item.id) + '::' + String(item.selectedSpec || item.specLabel || item.unit || ''));
          return !purchasedKeys.has(key);
        }));
      }
      this._skipNextOrderLoad = true;
      if (order.paymentMethod === 'demo') {
        this.setData({ demoPaymentOrder: { id: order._id, orderNo: order.orderNo || '', summary, total: lastOrder.total }, allOrderRows: [lastOrder], orderRows: [lastOrder], lastOrder, orderEmptyTitle: orderEmptyCopy('全部订单', 'title'), orderEmptyHint: orderEmptyCopy('全部订单', 'hint'), pendingReceiptCount: this.data.pendingReceiptCount + 1 });
        this.setUtility('demoPayment');
        return;
      }
      this.setUtility('orders');
      this.setData({ allOrderRows: [lastOrder], orderRows: [lastOrder], lastOrder, orderEmptyTitle: orderEmptyCopy('全部订单', 'title'), orderEmptyHint: orderEmptyCopy('全部订单', 'hint'), pendingReceiptCount: this.data.pendingReceiptCount + 1 });
      wx.showToast({ title: '订单已提交', icon: 'success' });
    } finally {
      this._submittingRemoteOrder = false;
    }
  },
  detailCheckout() {
    if (!this.data.selectedProduct) return;
    const quantity = Math.max(1, Number(this.data.detailDraftQty || 1));
    if (IS_CLOUD_MODE && !this.data.loggedIn) return this.requireLogin({ type: 'detailCheckout', id: this.data.selectedProduct.id, spec: this.data.selectedSpec, quantity, activeTab: this.data.activeTab });
    this.addProduct(this.data.selectedProduct.id, this.data.selectedSpec, () => this.goCheckout(), quantity);
  },
  finishDemoPayment() {
    const order = this.data.demoPaymentOrder;
    if (!order) return;
    this.setUtility('orders');
    this.setData({ demoPaymentOrder: null });
    wx.showToast({ title: '支付确认完成，未发生扣款', icon: 'success' });
  },
  placeOrder() {
    const purchasedCartItems = selectedCartItems(this.data.cartItems || []);
    if (!purchasedCartItems.length) return wx.showToast({ title: '购物车暂无可结算商品', icon: 'none' });
    const { address } = this.data;
    const addressReady = serviceConfig.provider === 'cloudbase' ? address.id && address.name && address.detail : address.name && /^1[3-9]\d{9}$/.test(address.phone) && address.detail;
    if (!addressReady) {
      this._returnToCheckoutAfterAddress = true;
      this.setUtility('address');
      this.setData({ showAddressForm: true });
      return wx.showToast({ title: '请先填写收货地址', icon: 'none' });
    }
    if (serviceConfig.provider === 'cloudbase' && this.data.checkoutQuoteState !== 'ready') {
      if (this.data.checkoutQuoteState !== 'loading') {
        this.setData({ checkoutQuoteState: 'loading', cartTotal: '--', freightTotal: '--', orderTotal: '--' });
        this.loadRemoteQuote();
      }
      return wx.showToast({ title: '正在核验本次报价，请稍候', icon: 'none' });
    }
    if (serviceConfig.provider === 'cloudbase') return this.placeRemoteOrder();
    const summary = purchasedCartItems.slice(0, 2).map(item => item.name).join('、') + (purchasedCartItems.length > 2 ? ` 等 ${purchasedCartItems.length} 件商品` : '');
    const lastOrder = { summary, total: this.data.orderTotal, deliveryTime: this.data.warehouse.eta };
    this.syncCart(this.data.cartItems.filter((item) => !purchasedCartItems.includes(item))); this._utilityHistory = []; this._utilityReturnPage = 'home'; this.setUtility('orders'); this.setData({ allOrderRows: [lastOrder], orderRows: [lastOrder], lastOrder, orderEmptyTitle: orderEmptyCopy('全部订单', 'title'), orderEmptyHint: orderEmptyCopy('全部订单', 'hint'), pendingReceiptCount: this.data.pendingReceiptCount + 1 }); wx.showToast({ title: '订单已生成', icon: 'success' });
  },

  openUtility(event) {
    const type = event.currentTarget.dataset.type; const filter = event.currentTarget.dataset.filter;
    const protectedTypes = ['orders', 'coupon', 'address', 'checkout', 'favorites', 'trace', 'aftersale', 'invoice', 'points', 'review', 'account'];
    if (protectedTypes.includes(type) && this.requireLogin({ type, filter, returnPage: this.data.page, activeTab: this.data.activeTab })) return;
    if (type === 'orders') return wx.navigateTo({ url: `/package-trade/pages/orders/index?filter=${encodeURIComponent(filter || '全部订单')}` });
    if (type === 'checkout') return this.goCheckout();
    this.openUtilityByType(type, filter);
  },
  setUtility(type, filter) {
    const copy = UTILITY[type] || ['梦食鲜', ''];
    const checkoutItems = type === 'checkout' ? selectedCartItems(this.data.cartItems || []) : this.data.checkoutItems;
    const checkoutPatch = type === 'checkout' ? { checkoutItems, checkoutItemCount: checkoutItems.length, checkoutItemQty: checkoutItems.reduce((sum, item) => sum + Number(item.qty || 0), 0), ...(serviceConfig.provider === 'cloudbase' ? { checkoutQuoteState: 'loading', cartTotal: '--', freightTotal: '--', orderTotal: '--' } : {}) } : {};
    const mineUtilityTypes = ['orders', 'coupon', 'address', 'favorites', 'trace', 'aftersale', 'invoice', 'points', 'review', 'account'];
    const utilityActiveTab = mineUtilityTypes.includes(type) ? 'mine' : this.data.activeTab;
    this.triggerPageMotion({ page: 'utility', activeTab: utilityActiveTab, utilityType: type, utilityTitle: copy[0], utilitySub: copy[1], orderFilter: filter || '全部订单', showAddressForm: false, ...checkoutPatch }, () => {
      if (type === 'checkout') this.loadRemoteQuote();
      if (type !== 'orders') return;
      if (serviceConfig.provider === 'cloudbase') {
        if (this._skipNextOrderLoad) {
          this._skipNextOrderLoad = false;
          return;
        }
        this.loadRemoteOrders();
      }
      else if (this.data.allOrderRows && this.data.allOrderRows.length) this.applyOrderRows(this.data.allOrderRows);
    });
  },
  openUtilityByType(type, filter) {
    const from = this.data.page; this._utilityHistory = this._utilityHistory || [];
    if (from === 'utility' && type !== this.data.utilityType) this._utilityHistory.push({ type: this.data.utilityType, filter: this.data.orderFilter });
    else if (from !== 'utility') { this._utilityReturnPage = from; this._utilityHistory = []; }
    this.setUtility(type, filter);
  },
  returnUtility() {
    if (this.data.showAddressForm) return this.setData({ showAddressForm: false });
    const previous = (this._utilityHistory || []).pop(); if (previous) return this.setUtility(previous.type, previous.filter);
    const page = this._utilityReturnPage || 'mine'; this.triggerPageMotion({ page, activeTab: page === 'detail' ? this.data.activeTab : page });
  },
  selectWarehouse(event) {
    const source = this.data.warehouses && this.data.warehouses.length ? this.data.warehouses : WAREHOUSES;
    const warehouse = source.find(item => item.name === event.currentTarget.dataset.warehouse) || source[0];
    if (!warehouse) return wx.showToast({ title: '暂无可选择配送仓', icon: 'none' });
    const areas = warehouse.areas || WAREHOUSE_AREAS[warehouse.name] || [];
    this.triggerPageMotion({ warehouse, warehouseAreaText: areas.join('、'), page: 'home', activeTab: 'home' }, () => wx.showToast({ title: `已切换至${warehouse.name}`, icon: 'none' }));
  },
  showAddressForm() {
    if (serviceConfig.provider !== 'cloudbase' || typeof wx.chooseAddress !== 'function') return this.setData({ showAddressForm: true });
    wx.chooseAddress({
      success: async (result) => {
        const phone = String(result.telNumber || '').replace(/\s/g, '');
        // nationalCode is only the country code (normally CN), so it cannot
        // express a local delivery area. Keep the client-submitted region key
        // aligned with the server-side demo delivery-area configuration.
        const regionCode = [result.cityName, result.countyName].map(value => String(value || '').trim()).filter(Boolean).join('/');
        if (!/^1[3-9]\d{9}$/.test(phone) || !regionCode || !result.detailInfo) return wx.showToast({ title: '微信地址信息不完整，暂不能保存', icon: 'none' });
        const saved = await addressApi.save({ name: result.userName, phone, provinceCode: result.provinceName, cityCode: result.cityName, districtCode: result.countyName, regionCode, detail: result.detailInfo, isDefault: true });
        if (!saved || !saved.ok || !saved.data || !saved.data.address) return wx.showToast({ title: saved && saved.error && saved.error.message || '地址保存失败，请稍后重试', icon: 'none' });
        const address = saved.data.address;
    this.setData({ address: { id: address._id, name: address.name, phone: '', masked: address.phoneMasked || '', detail: address.detail || '', regionCode: address.regionCode || regionCode }, showAddressForm: false });
        wx.showToast({ title: '收货地址已保存', icon: 'success' });
      },
      fail: (error) => {
        const message = String(error && error.errMsg || '');
        if (/cancel/i.test(message)) return;
        wx.showToast({ title: '无法打开地址簿，请稍后重试', icon: 'none' });
      }
    });
  },
  async saveAddress(event) {
    const value = event.detail.value;
    if (!value.name || !/^1[3-9]\d{9}$/.test(value.phone) || !value.detail) return wx.showToast({ title: '请完整填写收货信息', icon: 'none' });
    const phone = value.phone.trim();
    if (serviceConfig.provider === 'cloudbase' && !this.data.address.regionCode) return wx.showToast({ title: '请使用微信地址簿选择完整配送地址', icon: 'none' });
    if (serviceConfig.provider === 'cloudbase') {
      const saved = await addressApi.save({ name: value.name.trim(), phone, regionCode: this.data.address.regionCode, detail: value.detail.trim(), isDefault: true });
      if (!saved || !saved.ok || !saved.data || !saved.data.address) return wx.showToast({ title: saved && saved.error && saved.error.message || '地址保存失败，请稍后重试', icon: 'none' });
    }
    const resumeCheckout = this._returnToCheckoutAfterAddress;
    this._returnToCheckoutAfterAddress = false;
    this.setData({ address: { ...this.data.address, name: value.name.trim(), phone, masked: maskedPhone(phone), detail: value.detail.trim() }, showAddressForm: false }, () => {
      if (resumeCheckout) this.setUtility('checkout');
    });
    wx.showToast({ title: '收货地址已保存', icon: 'success' });
  },
  dailyCheckin() { if (this.data.checkedIn) return wx.showToast({ title: '今天已签到', icon: 'none' }); this.setData({ checkedIn: true, points: this.data.points + 5 }); wx.showToast({ title: '签到成功，已获得 5 积分', icon: 'success' }); },
  refreshDelivery() { wx.showToast({ title: `预计送达：${this.data.warehouse.eta}`, icon: 'none' }); }, useCoupon() { this.openUtilityByType('special'); },
  maskedPhone() { return maskedPhone(this.data.address.phone); }
});
