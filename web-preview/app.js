/* 商品视频只使用商品自身的媒体地址；未上传时显示真实空状态，不套用通用演示视频。 */
let products = [
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
products.forEach(product => {
  const rawUnit = String(product.unit || '').trim();
  const specStart = rawUnit.indexOf('品名规格');
  if (specStart >= 0) {
    const packaging = rawUnit.slice(0, specStart).replace(/[；;]\s*$/, '').trim();
    const spec = rawUnit.slice(specStart).replace(/^品名规格\s*[:：]\s*/, '').trim();
    product.packageUnit = packaging || rawUnit;
    product.specLabel = spec;
    product.unit = product.packageUnit;
  } else {
    product.packageUnit = rawUnit;
    product.specLabel = '';
  }
  if (!product.img) product.img = 'placeholder.svg';
});

const LOCAL_PRODUCT_LIMIT = 50;
products.splice(LOCAL_PRODUCT_LIMIT);

let categories = ['全部', '海鲜水产', '牛肉类', '猪肉类', '禽肉类', '羊肉类', '丸滑类', '面点类', '烧烤炸品', '预制菜熟食', '蔬菜类', '调味酱料', '甜品类', '耗材', '其他冻品'];
// 和小程序保持一一对应：每个真实分类单独显示，禁止把不同品类合并成泛分类。
const categoryPresentation = [
  { id: 'seafood', label: '海鲜水产', image: 'categories/seafood.png' },
  { id: 'beef', label: '牛肉类', image: 'categories/beef.png' },
  { id: 'pork', label: '猪肉类', image: 'categories/pork-ai-v1.jpg' },
  { id: 'lamb', label: '羊肉类', image: 'categories/lamb-ai-v1.jpg' },
  { id: 'poultry', label: '禽肉类', image: 'categories/chicken.png' },
  { id: 'balls', label: '丸滑类', image: 'categories/balls.png' },
  { id: 'pastry', label: '面点类', image: 'categories/dumpling.png' },
  { id: 'prepared', label: '预制菜熟食', image: 'categories/prepared-food-ai-v1.jpg' },
  { id: 'barbecue', label: '烧烤炸品', image: 'categories/barbecue-fried-ai-v1.jpg' },
  { id: 'vegetables', label: '蔬菜类', image: 'categories/vegetables.png' },
  { id: 'sauces', label: '调味酱料', image: 'categories/sauces.png' },
  { id: 'desserts', label: '甜品类', image: 'categories/desserts.png' },
  { id: 'other-frozen', label: '其他冻品', image: 'categories/other-frozen-ai-v1.jpg' },
  { id: 'supplies', label: '耗材', image: 'categories/supplies-ai-v1.jpg' }
];
let categoryGroups = categoryPresentation.map((item) => ({ ...item, categories: [item.label] })).concat([
  { id: '全部', label: '全部分类', image: 'frozen-hero-v2.png', categories: categories.slice(1) }
]);
/* 拼团商品配置:拼团价不区分 B/C 身份;size=成团人数,joined=当前已参团人数 */
const groupDeals = {
  1: { size: 5, joined: 3, ends: '明天 18:00 截止' },
  9: { size: 8, joined: 5, ends: '今晚 22:00 截止' },
  31: { size: 4, joined: 2, ends: '后天 12:00 截止' }
};
const groupOf = id => groupDeals[id] || null;
/* B/C 双端运费规则:B 端为商家采购运费,C 端为个人顾客运费 */
const FREIGHT_RULES = { B: { free: 199, fee: 15 }, C: { free: 99, fee: 8 } };
const freightRule = () => FREIGHT_RULES[state.role];
const feeRuleText = () => `满 ${freightRule().free} 元免基础配送费，未满收 ${freightRule().fee} 元`;
/* 各仓配送区域范围 */
const WAREHOUSE_AREAS = {
  '赣州仓': ['章贡区', '赣县区', '南康区', '赣州经开区', '蓉江新区'],
  '南康仓': ['南康区', '龙南市', '信丰县', '大余县']
};
const productVariants = {
  1: ['250g / 袋', '500g / 袋'],
  2: ['250g / 盒', '500g / 盒'],
  20: ['500g / 盒', '1kg / 盒'],
  22: ['200g × 2 / 盒', '200g × 4 / 盒'],
  31: ['1kg / 组', '1.5kg / 组']
};
const state = {
  tab: 'home', role: 'B', category: '全部', categoryGroup: '海鲜', query: '', cart: {}, frequent: [1, 2, 3, 4], selectedSpecs: {}, groupJoined: {},
  detailProductId: null, detailQty: 1, detailReturnPage: 'home', utilityReturnPage: 'mine', utilityKind: null, utilityFilter: '全部订单', utilityStack: [],
  pendingCheckout: false, lastOrder: null,
  delivery: { warehouse: '赣州仓', eta: '今天 18:30 前', feeRule: '满 99 元免基础配送费' },
  address: { name: '王女士', phone: '13800000000', detail: '江西省赣州市章贡区章江北大道 88 号 2 单元 702 室', area: '章贡区' },
  user: { loggedIn: false, phone: '138****0000' },
  member: { points: 268, checkedIn: false, reviewed: false },
  invoice: { title: '', email: '', applied: false },
  serviceMessages: []
};
const pages = [...document.querySelectorAll('.page')];
const tabs = [...document.querySelectorAll('[data-tab]')];
const toast = document.querySelector('.toast');
let toastTimer;

const byId = id => products.find(product => String(product.id) === String(id));
const money = value => `¥${Number(value).toFixed(1).replace('.0', '')}`;
const productImageSrc = product => {
  const image = product && product.img;
  if (!image) return '../assets/products/placeholder.svg';
  return /^(https?:|data:|cloud:)/i.test(image) ? image : `../assets/products/${image}`;
};
const detailVideoMarkup = product => {
  const video = String(product && product.video || '').trim();
  if (!video) {
    return '<div class="detail-video-empty"><b>该商品暂未上传视频</b><span>如需了解商品，可联系客服咨询</span></div>';
  }
  return `<div class="detail-video"><video src="${video}" poster="${productImageSrc(product)}" controls preload="none" playsinline></video></div><p class="detail-video-note">商品视频由商家上传，建议 Wi-Fi 环境观看</p>`;
};
const categoryImageSrc = image => /^(https?:|data:|cloud:)/i.test(image || '') ? image : `../assets/${image || 'categories/seafood.png'}`;
/* B/C 双端价格:商品价为零售价(C 端);B 端商家采购价约按零售价 8 折 */
const priceOf = product => (Number.isFinite(product.price) ? (state.role === 'B' ? Math.round(product.price * 0.8 * 10) / 10 : product.price) : 0);
const refPriceOf = product => (state.role === 'B' ? product.price : product.old);
const roleName = () => (state.role === 'B' ? '商家采购' : '个人顾客');
const canSeePrice = () => false;
/* 未登录时价格位显示为登录引导 */
const priceHtml = product => '<span class="price-gate">价格待补充</span>';
const refPriceHtml = product => (canSeePrice() ? `<del>${money(refPriceOf(product))}</del>` : '');
const cartSubtotal = () => Object.entries(state.cart).reduce((sum, [id, quantity]) => { const product = byId(id); return sum + (product ? priceOf(product) * quantity : 0); }, 0);
const deliveryFee = subtotal => (subtotal >= freightRule().free || subtotal <= 0 ? 0 : freightRule().fee);
const feeNote = subtotal => deliveryFee(subtotal) ? `配送费 ${money(deliveryFee(subtotal))}` : '已免配送费';
const itemCount = () => Object.values(state.cart).reduce((total, quantity) => total + quantity, 0);
const activePageId = () => document.querySelector('.page.is-active')?.dataset.page || 'home';
const maskedPhone = phone => String(phone).replace(/^(\d{3})\d+(\d{4})$/, '$1****$2');
const productPackage = product => product.packageUnit || product.unit || '规格待补充';
const productSpec = product => product.specLabel || '';
const productVariantsFor = product => product.skuOptions?.length
  ? product.skuOptions.map(option => option.label)
  : productVariants[product.id] || (productSpec(product) ? [productSpec(product)] : [productPackage(product)]);
const selectedUnit = product => state.selectedSpecs[product.id] || productVariantsFor(product)[0];
const escapeText = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function refreshDeliveryLabels() {
  document.querySelectorAll('[data-warehouse-name]').forEach(node => { node.textContent = state.delivery.warehouse; });
  const location = document.querySelector('.location-button span');
  if (location) location.textContent = state.delivery.warehouse;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1400);
}

function updateClock() {
  const now = new Date();
  const node = document.querySelector('[data-clock]');
  if (node) node.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function updateCartCount() {
  document.querySelectorAll('[data-cart-count]').forEach(node => {
    node.textContent = String(itemCount());
  });
  renderQuickCheckout();
}

function addToCart(id, quantity = 1) {
  state.cart[id] = (state.cart[id] || 0) + quantity;
  updateCartCount();
  renderCart();
  showToast(quantity > 1 ? `已加入购物车 ×${quantity}` : '已加入购物车');
}

function renderQuickCheckout() {
  const quickCheckout = document.querySelector('#quickCheckout');
  if (!quickCheckout) return;
  const activePage = document.querySelector('.page.is-active')?.dataset.page;
  const visible = ['home', 'category', 'frequent'].includes(activePage) && itemCount() > 0;
  quickCheckout.hidden = !visible;
  document.querySelector('.phone').classList.toggle('has-quick-checkout', visible);
  if (!visible) return;
  const rule = freightRule();
  if (!canSeePrice()) {
    quickCheckout.innerHTML = `<button data-action="open-login"><img src="../assets/icons/cart.svg" alt="购物车"><span><b class="price-gate">登录后查看价格</b><small>${itemCount()} 件商品 · ${roleName()}价</small></span></button><button data-action="checkout">去结算</button>`;
    return;
  }
  const total = cartSubtotal();
  const hint = total >= rule.free ? '已免配送费' : `差 ${money(rule.free - total)} 免配送费`;
  quickCheckout.innerHTML = `<button data-tab="cart"><img src="../assets/icons/cart.svg" alt="购物车"><span><b>${money(total)}</b><small>${itemCount()} 件商品 · ${hint}</small></span></button><button data-action="checkout">去结算</button>`;
}

function productCard(product) {
  return `<article class="catalog-card product-trigger" data-product="${product.id}">
    <div class="catalog-photo"><img src="${productImageSrc(product)}" alt="${product.name}"><span>${product.tag}</span></div>
    <div class="catalog-info"><h3>${product.name}</h3><p>${productPackage(product)}${productSpec(product) ? ` · 规格：${productSpec(product)}` : ''} · 月售 ${product.sales}</p>
      <div><b>${priceHtml(product)}</b>${refPriceHtml(product)}<button class="mini-add" data-add="${product.id}" aria-label="加入 ${product.name}">+</button></div>
    </div>
  </article>`;
}

const dealExtras = { 1: '冷链直达 · 坏单包赔', 2: '火锅必备 · 家庭分享', 3: '早餐常备 · 10 分钟上桌', 5: '家庭分享 · 煎烤方便' };
function renderDealList() {
  const dealView = document.querySelector('#dealList');
  if (!dealView) return;
  const featured = window.MengshixianApi?.config.provider === 'cloudbase'
    ? products.slice(0, 4) : [1, 2, 3, 5].map(byId).filter(Boolean);
  dealView.innerHTML = featured.map(product => {
    return `<article class="deal-card product-trigger" data-product="${product.id}">
      <div class="deal-image"><img src="${productImageSrc(product)}" alt="${product.name}"><span>${product.tag}</span></div>
      <div class="deal-copy"><h3>${product.name}</h3><p>${productPackage(product)}${productSpec(product) ? ` · 规格：${productSpec(product)}` : ''} · 月售 ${product.sales}</p>
        <div class="deal-price"><b>${priceHtml(product)}</b>${refPriceHtml(product)}</div>
        <small>${dealExtras[product.id] || ''}</small>
      </div>
      <button class="add-button" type="button" data-add="${product.id}">+</button>
    </article>`;
  }).join('');
}

function renderCategory() {
  const activeGroup = categoryGroups.find(group => group.id === state.categoryGroup) || categoryGroups[0] || { id: '全部', label: '全部分类', categories: [] };
  const activeCategories = activeGroup.categories;
  const filtered = products.filter(product =>
    (state.category === '全部' ? activeCategories.includes(product.category) : product.category === state.category) &&
    (!state.query || product.name.includes(state.query) || product.category.includes(state.query))
  );
  const visible = filtered;
  const sidebarCategories = categories;
  const resultTitle = state.query ? `“${state.query}” 的搜索结果` : `${state.category === '全部' ? activeGroup.label : state.category}`;
  document.querySelector('#categoryView').innerHTML = `
    <div class="catalog-topline"><b>分类选购</b></div>
    <button class="catalog-search" data-action="focus-search">⌕&nbsp;&nbsp;搜索冻品、火锅食材、早餐面点</button>
    <div class="major-category-strip">${categoryGroups.map(group => `<button class="${group.id === activeGroup.id ? 'is-active' : ''}" data-category-group="${group.id}"><img src="${categoryImageSrc(group.image)}" alt="${group.label}"><span>${group.label}</span></button>`).join('')}</div>
    <div class="catalog-layout"><aside class="catalog-side">${sidebarCategories.map(category => `<button class="${category === state.category ? 'is-active' : ''}" data-category="${category}">${category}</button>`).join('')}</aside>
      <section class="catalog-results"><div class="catalog-result-head"><b>${resultTitle}</b><small>${state.query && !filtered.length ? '未找到完全匹配，推荐如下' : `共 ${filtered.length} 件`}</small></div>${visible.map(product => { const chooseSpec = productVariantsFor(product).length > 1; return `<article class="catalog-row product-trigger" data-product="${product.id}"><img src="${productImageSrc(product)}" alt="${product.name}"><div><h3>${product.name}</h3><p>${product.unit}</p><b>${priceHtml(product)}<small> / 件</small></b></div><button class="${chooseSpec ? 'choose-spec' : ''}" ${chooseSpec ? `data-product="${product.id}"` : `data-add="${product.id}"`} aria-label="${chooseSpec ? `选择 ${product.name} 规格` : `加入 ${product.name}`}">${chooseSpec ? '选规格' : '+'}</button></article>`; }).join('')}</section>
    </div>
  `;
}

function renderGroupList() {
  const groupView = document.querySelector('#groupList');
  if (!groupView) return;
  groupView.innerHTML = Object.keys(groupDeals).map(id => {
    const product = byId(id);
    const group = groupOf(id);
    const done = group.joined >= group.size;
    return `<article class="deal-card group-card product-trigger" data-product="${product.id}">
      <div class="deal-image"><img src="${productImageSrc(product)}" alt="${product.name}"><span class="group-tag">${group.size} 人团</span></div>
      <div class="deal-copy"><h3>${product.name}</h3><p>${productPackage(product)} · 已参团 ${group.joined} 人</p>
        <div class="deal-price"><span>¥</span><b>${canSeePrice() ? money(group.price) : '<span class="price-gate" data-action="open-login">登录后查看价格</span>'}</b>${canSeePrice() ? `<del>${money(product.price)}</del>` : ''}</div>
        <small>${group.ends} · 拼团价不分身份</small>
      </div>
      <button class="group-buy" type="button" data-open-group="${product.id}">${done ? '已成团' : '去拼团'}</button>
    </article>`;
  }).join('');
}

function renderFrequent() {
  const list = state.frequent.map(byId).filter(Boolean);
  document.querySelector('#frequentView').innerHTML = `
    <div class="frequent-banner"><div><b>常买好物</b><span>一键补齐冰箱库存</span></div><button data-action="add-frequent">全部加购</button></div>
    <div class="simple-list">${list.map(product => `<article class="simple-item product-trigger" data-product="${product.id}">
      <img src="${productImageSrc(product)}" alt="${product.name}"><div><h3>${product.name}</h3><p>${productPackage(product)} · ${product.category}</p><b>${priceHtml(product)}</b></div><button class="outline-add" data-add="${product.id}">加购</button>
    </article>`).join('')}</div>
  `;
}

function renderCart() {
  const entries = Object.entries(state.cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ product: byId(id), quantity }))
    .filter(entry => entry.product);
  const total = entries.reduce((sum, entry) => sum + priceOf(entry.product) * entry.quantity, 0);
  const fee = deliveryFee(total);
  const itemPrice = product => priceHtml(product);
  document.querySelector('#cartView').innerHTML = entries.length ? `
    <div class="delivery-note"><img src="../assets/icons/truck.svg" alt=""><div><b>${state.delivery.eta}</b><small>${canSeePrice() ? `${roleName()}价结算 · ${feeRuleText()}` : '登录后按身份展示价格与运费规则'}</small></div></div>
    <div class="cart-list">${entries.map(({ product, quantity }) => `<article class="cart-item">
      <img src="${productImageSrc(product)}" alt="${product.name}"><div class="cart-item-main"><h3>${product.name}</h3><p>${selectedUnit(product)}</p><b>${itemPrice(product)}</b></div>
      <div class="qty"><button data-qty="${product.id}" data-delta="-1">−</button><span>${quantity}</span><button data-qty="${product.id}" data-delta="1">+</button></div>
    </article>`).join('')}</div>
    <div class="cart-total"><span><small>${canSeePrice() ? `商品 ${money(total)} ＋ 配送费 ${fee ? money(fee) : '0（满额已免）'}${state.role === 'B' ? ' · 已按商家采购价计算' : ''}` : '登录后查看价格明细与运费'}</small>${canSeePrice() ? `应付合计 <b>${money(total + fee)}</b>` : '<b class="price-gate" data-action="open-login">登录后查看合计</b>'}</span><button data-action="checkout">去结算</button></div>
  ` : `<div class="empty-state cart-empty"><img src="../assets/icons/cart.svg" alt=""><b>购物车还是空的</b><small>去首页挑一些喜欢的食材吧</small><button data-tab="home">去逛逛</button></div>`;
}

function renderMine() {
  if (!state.user.loggedIn) {
    document.querySelector('#mineView').innerHTML = `
      <button class="guest-profile" data-action="open-login"><span class="guest-avatar"><img src="../assets/icons/user.svg" alt=""></span><span><b>登录 / 注册</b><small>登录后查看订单、优惠券和收货地址</small></span><i>›</i></button>
      <div class="service-list"><button data-utility="service"><img src="../assets/icons/headset.svg" alt=""><span>联系客服</span><b>在线 ›</b></button></div>`;
    return;
  }
  document.querySelector('#mineView').innerHTML = `
    <section class="consumer-profile"><div class="consumer-profile-head"><div class="avatar">鲜</div><div><b>梦食鲜顾客</b><span>${state.user.phone} · ${state.role === 'B' ? '商家采购' : '普通会员'}</span></div><button data-utility="account" aria-label="账户设置">⚙</button></div><div class="member-stats"><button data-utility="coupon"><b>3</b><span>优惠券</span></button><button data-utility="points"><b>${state.member.points}</b><span>积分</span></button><button data-utility="favorites"><b>4</b><span>我的收藏</span></button></div></section>
    <button class="new-member-banner" data-utility="coupon"><span>新客福利</span><b>领券后下单更省</b><i>去领取 ›</i></button>
    <div class="order-card"><div class="order-title"><b>我的订单</b><button data-utility="orders">全部订单 ›</button></div>
      <div class="order-grid">
        <button data-utility="orders" data-order-filter="待确认"><img src="../assets/icons/wallet.svg" alt=""><span>待确认</span>${state.lastOrder ? '<i>1</i>' : ''}</button>
        <button data-utility="orders" data-order-filter="待收货"><img src="../assets/icons/box.svg" alt=""><span>待收货</span></button>
        <button data-utility="orders" data-order-filter="售后/退款"><img src="../assets/icons/refresh.svg" alt=""><span>售后/退款</span></button>
        <button data-utility="review"><img src="../assets/icons/file.svg" alt=""><span>评价晒单</span></button>
      </div>
    </div>
    <section class="tool-panel"><h3>常用工具</h3><div class="consumer-tools"><button data-tab="frequent"><img src="../assets/icons/list.svg" alt="">常购清单</button><button data-utility="favorites"><img src="../assets/icons/heart.svg" alt="">我的收藏</button><button data-utility="trace"><img src="../assets/icons/package.svg" alt="">食品溯源</button><button data-utility="aftersale"><img src="../assets/icons/refresh.svg" alt="">售后服务</button><button data-utility="invoice"><img src="../assets/icons/file.svg" alt="">电子发票</button><button data-utility="points"><img src="../assets/icons/coupon.svg" alt="">积分中心</button><button data-utility="review"><img src="../assets/icons/file.svg" alt="">评价晒单</button><button data-utility="address"><img src="../assets/icons/location.svg" alt="">收货地址</button><button data-utility="coldchain"><img src="../assets/icons/truck.svg" alt="">冷链保障</button><button data-utility="about"><img src="../assets/icons/user.svg" alt="">关于梦食鲜</button></div></section>
    <section class="tool-panel help-panel"><h3>帮助中心</h3><div class="consumer-tools two-tools"><button data-utility="faq"><img src="../assets/icons/headset.svg" alt="">常见问题</button><button data-utility="policy"><img src="../assets/icons/file.svg" alt="">服务条款</button></div></section>
    <section class="customer-panel"><b>客服中心</b><p>服务时间 08:00–22:00 · 冷链配送问题优先处理</p><button data-utility="service">联系在线客服 ›</button></section>
  `;
}

function openProduct(id) {
  const product = byId(id);
  if (!product) return;
  state.detailProductId = product.id;
  state.detailQty = 1;
  if (!state.selectedSpecs[product.id]) state.selectedSpecs[product.id] = productVariantsFor(product)[0];
  state.detailReturnPage = activePageId();
  const detailPage = document.querySelector('[data-page="detail"]');
  pages.forEach(page => page.classList.toggle('is-active', page === detailPage));
  tabs.forEach(tab => tab.classList.remove('is-active'));
  document.querySelector('.tabbar').classList.add('is-hidden');
  renderQuickCheckout();
  renderProductDetail();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderProductDetail() {
  const product = byId(state.detailProductId);
  if (!product) return;
  const variants = productVariantsFor(product);
  const selectedVariant = state.selectedSpecs[product.id] || variants[0];
  document.querySelector('#detailView').innerHTML = `
    <header class="detail-head"><button data-action="detail-back" aria-label="返回">‹</button><b>商品详情</b><button data-utility="service" aria-label="联系客服"><img src="../assets/icons/headset.svg" alt=""></button></header>
    <section class="detail-product"><div class="detail-photo"><img src="${productImageSrc(product)}" alt="${product.name}"><span>${product.tag}</span></div><div class="detail-summary"><h1>${product.name}</h1><p>${selectedVariant} · 月售 ${product.sales}${canSeePrice() ? ` · ${roleName()}价` : ''}</p><div><b>${priceHtml(product)}</b>${refPriceHtml(product)}</div>${canSeePrice() && state.role === 'B' ? '<p class="b-price-note">商家采购价 · 较零售价省约 20%</p>' : ''}${groupOf(product.id) && !canSeePrice() ? '<p class="b-price-note">登录后可查看采购价与拼团价</p>' : ''}</div></section>
    <section class="detail-panel"><div class="detail-row"><b>选择规格</b><span>${selectedVariant}</span></div>${variants.length > 1 ? `<div class="detail-specs">${variants.map(variant => `<button class="${variant === selectedVariant ? 'is-active' : ''}" data-spec="${product.id}" data-spec-value="${variant}">${variant}</button>`).join('')}</div>` : ''}</section>
    ${groupOf(product.id) ? `<section class="detail-panel detail-group-panel"><div class="detail-row"><b>拼团专场</b><span class="group-tag">${groupOf(product.id).size} 人团</span></div><div class="group-summary"><div class="deal-price"><span>¥</span><b>${canSeePrice() ? money(groupOf(product.id).price) : '<span class="price-gate" data-action="open-login">登录后查看拼团价</span>'}</b>${canSeePrice() ? `<del>${money(product.price)}</del>` : ''}</div><small>${groupOf(product.id).ends} · 已参团 ${groupOf(product.id).joined}/${groupOf(product.id).size} 人 · 拼团价不分身份</small></div><button class="group-buy" type="button" data-open-group="${product.id}">${groupOf(product.id).joined >= groupOf(product.id).size ? '查看成团结果' : '去拼团'}</button></section>` : ''}
    <section class="detail-panel detail-qty"><b>购买数量</b><div class="qty"><button data-detail-qty="-1" aria-label="减少数量" ${state.detailQty <= 1 ? 'disabled' : ''}>−</button><span data-detail-qty-value>${state.detailQty}</span><button data-detail-qty="1" aria-label="增加数量">+</button></div></section>
    <section class="detail-panel detail-service"><div><b>配送</b><span>${state.delivery.warehouse}冷链配送，预计送达时段：${state.delivery.eta}</span></div><div><b>服务</b><span>全程冷链，商品异常可申请售后</span></div></section>
    <section class="detail-panel"><h2>商品详情</h2><dl><div><dt>商品规格</dt><dd>${selectedVariant}</dd></div><div><dt>贮存条件</dt><dd>-18℃ 冷冻保存</dd></div><div><dt>温馨提示</dt><dd>开封后请尽快食用。配送时段以商家最终确认信息为准。</dd></div></dl></section>
    <section class="detail-panel detail-video-panel"><h2>教学视频</h2>${detailVideoMarkup(product)}</section>
    <section class="detail-panel detail-origin"><h2>食材保障</h2><p>本商品由梦食鲜冷冻仓配发出，出库前完成包装与低温核验。</p><button data-utility="trace">查看食品溯源</button></section>
    <div class="detail-actions"><button data-action="detail-add">加入购物车${canSeePrice() ? `<small> ${money(priceOf(product) * state.detailQty)}</small>` : ''}</button><button data-action="detail-checkout">立即结算</button></div>
  `;
}

function closeProduct() {
  if (state.detailReturnPage === 'utility') {
    const utilityPage = document.querySelector('[data-page="utility"]');
    pages.forEach(page => page.classList.toggle('is-active', page === utilityPage));
    document.querySelector('.tabbar').classList.add('is-hidden');
    renderQuickCheckout();
    return window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  switchTab(state.detailReturnPage || 'home');
}

function switchTab(target) {
  state.tab = target;
  document.querySelector('.tabbar').classList.remove('is-hidden');
  pages.forEach(page => page.classList.toggle('is-active', page.dataset.page === target));
  tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === target));
  if (target === 'category') renderCategory();
  if (target === 'frequent') renderFrequent();
  if (target === 'cart') renderCart();
  if (target === 'mine') renderMine();
  renderQuickCheckout();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const utilityTitles = { warehouse: '选择配送仓', activity: '活动头条', special: '特价专区', orders: '我的订单', coupon: '优惠券', address: '收货地址', service: '联系客服', account: '账户信息', login: '手机号登录', checkout: '确认订单', favorites: '我的收藏', trace: '食品溯源', aftersale: '售后服务', invoice: '电子发票', invoiceHead: '发票抬头', invoiceRecords: '开票记录', points: '积分中心', review: '评价晒单', coldchain: '冷链保障', about: '关于梦食鲜', faq: '常见问题', policy: '服务条款', group: '拼团专场' };

function utilityHead(kind, sub) {
  return `<div class="subpage-head utility-head"><button class="back-home" data-action="utility-back">‹</button><div><h2>${utilityTitles[kind]}</h2><small>${sub || ''}</small></div></div>`;
}

function openUtility(kind, filter = '全部订单', fromBack = false) {
  const previousPage = activePageId();
  if (!fromBack && previousPage === 'utility' && kind !== state.utilityKind) {
    state.utilityStack.push({ kind: state.utilityKind, filter: state.utilityFilter });
  } else if (!fromBack && previousPage !== 'utility') {
    state.utilityReturnPage = previousPage;
    state.utilityStack = [];
  }
  state.utilityKind = kind;
  state.utilityFilter = filter || '全部订单';
  const utilityPage = document.querySelector('[data-page="utility"]');
  pages.forEach(page => page.classList.toggle('is-active', page === utilityPage));
  tabs.forEach(tab => tab.classList.remove('is-active'));
  document.querySelector('.tabbar').classList.add('is-hidden');
  renderUtility(kind, filter);
  renderQuickCheckout();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function returnFromUtility() {
  const previousUtility = state.utilityStack.pop();
  if (previousUtility) return openUtility(previousUtility.kind, previousUtility.filter, true);
  if (state.utilityReturnPage === 'detail') {
    const detailPage = document.querySelector('[data-page="detail"]');
    pages.forEach(page => page.classList.toggle('is-active', page === detailPage));
    document.querySelector('.tabbar').classList.add('is-hidden');
    renderQuickCheckout();
    return window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  return switchTab(state.utilityReturnPage || 'mine');
}

function renderUtility(kind, filter = '全部订单') {
  let body = '';
  if (kind === 'login') {
    body = utilityHead(kind, '网页端体验登录') + `
      <section class="phone-login"><div class="login-mark">鲜</div><h3>梦食鲜，鲜到家</h3><p>当前账号：<b>${state.user.phone}</b></p><button data-action="one-tap-login">一键登录</button><small>网页端不会读取或保存手机号</small></section>`;
  }
  if (kind === 'warehouse') {
    body = utilityHead(kind, '配送范围和时段以仓库为准') + `
      <div class="warehouse-note">当前服务地址所属区域：${state.address.area} · 可配送</div>
      <div class="choice-list">${['赣州仓', '南康仓'].map(name => `<button data-warehouse="${name}"><b>${name}</b><span>预计送达时段：${name === '赣州仓' ? '今天 18:30 前' : '今天 19:30 前'}</span><span class="area-line">配送范围：${WAREHOUSE_AREAS[name].join('、')}</span><i>${state.delivery.warehouse === name ? '当前选择' : '可选'}</i></button>`).join('')}</div>
      <div class="activity-list"><b>配送范围说明</b><p>各仓仅覆盖上方列出的区域，下单前请确认收货地址在配送范围内</p><p>区域范围以正式运营配置为准，超出范围可联系客服协调</p></div>`;
  }
  if (kind === 'activity') {
    body = utilityHead(kind, '活动内容以正式运营配置为准') + `
      <section class="activity-hero"><span>家庭囤货</span><h3>速冻食材<br>按需选购</h3><p>速冻面点、火锅食材与海鲜水产可按分类浏览</p><button data-utility="special">查看商品</button></section>
      <section class="activity-list"><b>活动说明</b><p>${feeRuleText()}</p><p>拼团专场：人满自动成团，拼团价不区分顾客/商家身份</p><p>优惠规则和商品库存以实际运营页面为准</p></section>`;
  }
  if (kind === 'special') {
    body = utilityHead(kind, '精选家庭冷冻食材') + `<div class="catalog-list utility-products">${products.slice(0, 6).map(productCard).join('')}</div>`;
  }
  if (kind === 'orders') {
    const labels = ['全部订单', '待确认', '待收货', '售后/退款'];
    const latest = state.lastOrder;
    const matchesFilter = filter === '全部订单' || filter === '待确认';
    const latestOrder = latest && matchesFilter ? `
      <section class="delivery-status"><div class="delivery-status-head"><div><span>待商家确认</span><b>配送时段待确认</b></div></div><p>订单已提交，配送时段将由商家确认。</p><div class="delivery-steps"><span class="is-done">订单已提交<small>已完成</small></span><span class="is-current">商家确认<small>待处理</small></span><span>冷链配送<small>待出库</small></span><span>已送达<small>待确认</small></span></div></section>
      <article><div><b>梦食鲜 · ${state.delivery.warehouse}</b><span class="pending">待确认</span></div><p>${latest.summary}</p><small>配送时段将由商家确认</small><strong>合计 ${money(latest.total)}</strong><button data-utility="service">咨询客服</button></article>` : `
      <div class="empty-state order-empty"><img src="../assets/icons/box.svg" alt=""><b>暂无订单</b><small>${filter === '全部订单' ? '提交订单后可在这里查看状态' : '当前筛选下暂无订单'}</small>${filter === '全部订单' ? '<button data-tab="home">去选购</button>' : ''}</div>`;
    body = utilityHead(kind, '订单状态与配送进度') + `
      <div class="category-chips">${labels.map(label => `<button class="${label === filter ? 'is-active' : ''}" data-order-filter="${label}">${label}</button>`).join('')}</div>
      <div class="order-history">${latestOrder}</div>`;
  }
  if (kind === 'coupon') {
    body = utilityHead(kind, '下单时自动推荐可用优惠') + `
      <button class="coupon-card" data-utility="special"><b>¥12</b><div><strong>新客满减券</strong><span>满 69 元可用</span></div><i>去选购</i></button>
      <button class="coupon-card soft" data-utility="special"><b>¥8</b><div><strong>冷链配送券</strong><span>满 99 元可用</span></div><i>去选购</i></button>
      <button class="coupon-card soft" data-utility="special"><b>9.5折</b><div><strong>家庭囤货券</strong><span>适用商品以正式运营规则为准</span></div><i>去选购</i></button>`;
  }
  if (kind === 'group') {
    body = utilityHead(kind, '人满自动成团 · 拼团价不分顾客/商家身份') + Object.keys(groupDeals).map(id => {
      const product = byId(id);
      const group = groupOf(id);
      const mine = state.groupJoined[id];
      const done = group.joined >= group.size;
      const seats = Array.from({ length: group.size }, (_, index) => `<i class="${index < group.joined ? 'is-full' : ''}">${index < group.joined ? '✓' : '?'}</i>`).join('');
      const percent = Math.round(group.joined / group.size * 100);
      return `<section class="group-page-card">
        <article class="simple-item product-trigger" data-product="${product.id}"><img src="${productImageSrc(product)}" alt="${product.name}"><div><h3>${product.name}</h3><p>${productPackage(product)} · ${group.size} 人团</p><b>${canSeePrice() ? `拼团价 ${money(group.price)}` : '<span class="price-gate" data-action="open-login">登录后查看拼团价</span>'}</b></div></article>
        <div class="group-progress"><div class="group-progress-bar"><i style="width:${percent}%"></i></div><small>${group.joined}/${group.size} 人 · ${group.ends}</small></div>
        <div class="group-seats">${seats}</div>
        ${done ? '<p class="group-done">🎉 已成团！按拼团价安排发货</p>' : mine ? '<p class="group-done">已参团，等待更多人加入</p>' : `<button class="group-join" data-action="join-group" data-group="${product.id}">参与拼团（还差 ${group.size - group.joined} 人）</button>`}
      </section>`;
    }).join('') + `<section class="activity-list"><b>拼团规则</b><p>拼团价不区分个人顾客/商家采购身份，不与其他优惠叠加</p><p>人满自动成团；网页端体验不产生真实支付与发货</p></section>`;
  }
  if (kind === 'address') {
    body = utilityHead(kind, '管理配送地址') + `
      <div class="address-card"><b>${state.address.name} <small>${maskedPhone(state.address.phone)}</small></b><p>${state.address.detail}</p><span>${state.address.area} · 可配送 · 默认地址</span></div>
      <button class="wide-outline" data-action="new-address">编辑收货地址</button>`;
  }
  if (kind === 'checkout') {
    const entries = Object.entries(state.cart).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ product: byId(id), quantity })).filter(entry => entry.product);
    const total = entries.reduce((sum, entry) => sum + priceOf(entry.product) * entry.quantity, 0);
    const fee = deliveryFee(total);
    body = utilityHead(kind, '请确认收货信息与配送时段') + (entries.length ? `
      <button class="checkout-address" data-utility="address"><div><b>${state.address.name} ${maskedPhone(state.address.phone)}</b><p>${state.address.detail}</p></div><i>›</i></button>
      <section class="checkout-delivery"><b>${state.delivery.warehouse}冷链配送</b><span>预计送达时段：${state.delivery.eta}</span><small>${roleName()}价结算 · ${feeRuleText()}；实际配送以商家最终确认信息为准</small><small>配送范围：${WAREHOUSE_AREAS[state.delivery.warehouse].join('、')}</small></section>
      <section class="checkout-products">${entries.map(({ product, quantity }) => `<article><img src="${productImageSrc(product)}" alt="${product.name}"><div><b>${product.name}</b><span>${selectedUnit(product)}</span></div><strong>${money(priceOf(product))} × ${quantity}</strong></article>`).join('')}</section>
      <section class="checkout-total"><span>商品 ${money(total)}${fee ? ` ＋ 配送费 ${money(fee)}` : ' · 已免配送费'}${state.role === 'B' ? '（商家采购价）' : ''}</span><b>合计 ${money(total + fee)}</b></section><button class="place-order" data-action="place-order">提交订单</button>` : `<div class="empty-state"><img src="../assets/icons/cart.svg" alt=""><b>购物车还是空的</b><small>添加商品后再来结算吧</small><button data-tab="home">去首页逛逛</button></div>`);
  }
  if (kind === 'service') {
    const messages = state.serviceMessages.map(message => `<p class="chat-message is-user">${escapeText(message)}</p>`).join('');
    body = utilityHead(kind, '在线客服') + `
      <div class="service-intro"><div class="avatar">鲜</div><div><b>梦食鲜客服</b><span>订单、配送与商品问题可咨询</span></div></div>
      <div class="chat-panel"><p>您好，需要帮您找食材还是查询订单？</p>${messages}<button data-utility="orders">查询我的订单</button><button data-utility="special">查看商品</button></div>
      <div class="chat-input"><input placeholder="输入您想咨询的问题"><button data-action="send-message">发送</button></div>`;
  }
  if (kind === 'account') {
    body = utilityHead(kind, '会员等级与账户设置') + `
      <div class="account-summary"><div class="avatar">鲜</div><b>梦食鲜顾客</b><span>${roleName()}身份 · ${state.member.points} 积分</span></div>
      <div class="setting-list"><button data-action="switch-role">切换为${state.role === 'B' ? '个人顾客' : '商家采购'}身份 <b>›</b></button><button data-utility="coupon">我的优惠券 <b>›</b></button><button data-utility="address">收货地址 <b>›</b></button><button data-utility="service">联系客服 <b>›</b></button><button data-action="logout">退出登录 <b>›</b></button></div>`;
  }
  if (kind === 'favorites') {
    body = utilityHead(kind, '收藏的食材降价会提醒您') + `<div class="simple-list">${products.slice(0, 4).map(product => `<article class="simple-item product-trigger" data-product="${product.id}"><img src="${productImageSrc(product)}" alt="${product.name}"><div><h3>${product.name}</h3><p>${productPackage(product)} · ${product.category}</p><b>${priceHtml(product)}</b></div><button class="outline-add" data-add="${product.id}">加购</button></article>`).join('')}</div>`;
  }
  if (kind === 'trace') {
    const traceProduct = byId(state.detailProductId) || byId(2);
    body = utilityHead(kind, '每一份冻品都有可查来源') + `<section class="trace-card"><b>${traceProduct.name}</b><span>展示批次：待批次数据录入</span><div><i>✓</i><p><strong>原料验收</strong><small>低温入库信息将在批次资料完善后展示</small></p></div><div><i>✓</i><p><strong>分拣包装</strong><small>出库前完成包装与低温核验</small></p></div><div><i>✓</i><p><strong>配送信息</strong><small>配送状态将在商家确认后展示</small></p></div></section><button class="wide-outline" data-utility="orders">查看订单</button>`;
  }
  if (kind === 'aftersale') {
     body = utilityHead(kind, '质量、漏发或配送问题可申请售后') + `<section class="after-card"><b>售后申请说明</b><p>已完成订单可提交对应商品的售后申请。</p><small>当前没有历史售后记录。</small><button data-utility="service">咨询售后</button></section><section class="after-card"><b>售后进度</b><p>暂无售后申请</p><button data-utility="faq">查看售后说明</button></section>`;
  }
  if (kind === 'invoice') {
     body = utilityHead(kind, '订单完成后可申请电子发票') + `<section class="invoice-hero"><b>电子发票</b><span>发票信息仅在当前页面保存</span></section><button class="invoice-entry" data-utility="invoiceHead"><span>▧</span><div><b>发票抬头管理</b><small>个人抬头、邮箱与接收方式</small></div><i>›</i></button><button class="invoice-entry" data-utility="invoiceRecords"><span>☷</span><div><b>开票记录</b><small>查看当前申请状态</small></div><i>›</i></button>`;
  }
  if (kind === 'invoiceHead') {
    body = utilityHead(kind, '用于开具电子普通发票') + `<form class="form-card" id="invoiceHeadForm"><label>发票抬头<input name="title" required value="${escapeText(state.invoice.title)}"></label><label>接收邮箱<input name="email" type="email" required value="${escapeText(state.invoice.email)}"></label><button type="submit">保存抬头信息</button></form>`;
  }
  if (kind === 'invoiceRecords') {
    body = utilityHead(kind, '可为已完成订单申请开票') + (state.invoice.applied
       ? `<section class="after-card"><b>电子发票申请已记录</b><p>申请状态：等待商家处理</p><small>发票服务接入后会同步实际结果</small></section>`
       : `<section class="after-card"><b>当前没有可开票订单</b><p>提交订单后可申请电子发票。</p><button data-action="apply-invoice">提交申请</button></section>`);
  }
  if (kind === 'points') {
    body = utilityHead(kind, '签到、下单和评价均可获得积分') + `<section class="points-hero"><b>${state.member.points}</b><span>当前积分</span><button data-action="daily-checkin" ${state.member.checkedIn ? 'disabled' : ''}>${state.member.checkedIn ? '今日已签到' : '今日签到领积分'}</button></section><div class="activity-list"><b>积分明细</b><p>订单完成奖励：按运营规则发放</p><p>首次评价晒单：${state.member.reviewed ? '已记录 +20 积分' : '提交评价后可获得积分'}</p><p>每日签到：${state.member.checkedIn ? '已记录 +5 积分' : '可领取 +5 积分'}</p></div>`;
  }
  if (kind === 'review') {
     body = utilityHead(kind, '分享真实体验，帮助更多人挑选食材') + `<section class="after-card"><b>谷饲肥牛卷</b><p>${state.member.reviewed ? '评价已提交，积分已更新' : '提交评价后可获得相应积分'}</p>${state.member.reviewed ? '<small>当前已记录评价</small>' : '<button data-action="submit-review">提交评价</button>'}</section><section class="after-card"><b>我的晒单</b><p>${state.member.reviewed ? '已生成 1 条评价记录' : '暂无晒单记录'}</p></section>`;
  }
  if (kind === 'coldchain') {
    body = utilityHead(kind, '从仓库到家，按服务规则低温配送') + `<section class="trace-card"><b>冷链服务说明</b><div><i>1</i><p><strong>-18℃ 冷冻仓储</strong><small>正式履约时由仓配环节完成温度核验</small></p></div><div><i>2</i><p><strong>保温周转箱配送</strong><small>配送时效以所选仓和地址为准</small></p></div><div><i>3</i><p><strong>异常快速售后</strong><small>收到商品异常可联系在线客服</small></p></div></section><button class="wide-outline" data-utility="service">咨询冷链配送</button>`;
  }
  if (kind === 'about') {
    body = utilityHead(kind, '让家庭囤货更安心') + `<section class="info-card"><b>梦食鲜冻品商城</b><p>面向家庭用户提供速冻面点、火锅食材、海鲜水产、调理肉制品及冷冻食品配送服务。</p><p>配送与售后规则会随所在服务区域和实际订单展示。</p></section><button class="wide-outline" data-utility="service">联系客服</button>`;
  }
  if (kind === 'faq') {
    body = utilityHead(kind, '下单与配送常见问题') + `<section class="faq-list"><details open><summary>配送时间如何计算？</summary><p>结算页会展示预计送达时段；具体时间根据地址、仓库和商家排期确认。</p></details><details><summary>冷冻食品如何验收？</summary><p>请在收货时核对包装与商品状态，如有异常及时联系客服。</p></details><details><summary>如何申请退款或售后？</summary><p>正式项目会在已完成订单内提供对应商品的售后申请入口。</p></details></section>`;
  }
  if (kind === 'policy') {
     body = utilityHead(kind, '购物服务与隐私说明') + `<section class="info-card"><b>服务说明</b><p>下单前请确认商品规格、配送地址和预计送达时间。生鲜冻品签收后的售后以实际商品状态和平台规则为准。</p><p>当前网页仅用于体验，微信授权、订单、配送和会员权益不会写入真实业务数据。</p></section>`;
  }
  document.querySelector('#utilityView').innerHTML = body;
}

function selectWarehouse(name) {
  const options = { '赣州仓': { warehouse: '赣州仓', eta: '今天 18:30 前' }, '南康仓': { warehouse: '南康仓', eta: '今天 19:30 前' } };
  state.delivery = { ...state.delivery, ...(options[name] || options['赣州仓']) };
  refreshDeliveryLabels();
  showToast(`已切换至${name}`);
  switchTab('home');
}

function showAddressForm() {
  document.querySelector('#utilityView').innerHTML = utilityHead('address', '填写后将作为默认配送地址') + `
    <form class="address-form" id="addressForm"><label>收货人<input name="name" required value="${state.address.name}"></label><label>手机号码<input name="phone" required inputmode="numeric" pattern="1[3-9]\\d{9}" value="${state.address.phone}"></label><label>详细地址<textarea name="detail" required>${state.address.detail}</textarea></label><button type="submit">保存收货地址</button></form>`;
}

function startSearch() {
  state.query = document.querySelector('.search-row input').value.trim();
  state.category = '全部';
  state.categoryGroup = '全部';
  switchTab('category');
}

function clearSearchInput() {
  const searchInput = document.querySelector('.search-row input');
  if (searchInput) searchInput.value = '';
}

function sendChatMessage() {
  const input = document.querySelector('.chat-input input');
  if (!input.value.trim()) return showToast('请输入要咨询的内容');
  state.serviceMessages.push(input.value.trim());
  renderUtility('service');
  showToast('消息已发送');
  const chatInput = document.querySelector('.chat-input');
  if (chatInput) chatInput.scrollIntoView({ block: 'end', behavior: 'smooth' });
}

function openLogin() {
  document.querySelector('#loginView').innerHTML = `
    <section class="wechat-login"><div class="wechat-mark">微信</div><h2>微信授权登录</h2><p>请选择身份，登录后可体验订单、优惠券和地址页面</p><button class="role-btn role-btn-b" data-action="one-tap-login" data-role="B">商家采购登录</button><button class="role-btn role-btn-c" data-action="one-tap-login" data-role="C">个人顾客登录</button><label><input id="loginAgree" type="checkbox"> 我已阅读并同意《服务协议》和《隐私政策》</label><small>网页预览不会读取或保存手机号；商家采购享批发价，个人顾客按零售价</small></section>`;
  const sheet = document.querySelector('#loginSheet');
  sheet.classList.add('is-visible');
  sheet.setAttribute('aria-hidden', 'false');
}

function closeLogin() {
  const sheet = document.querySelector('#loginSheet');
  sheet.classList.remove('is-visible');
  sheet.setAttribute('aria-hidden', 'true');
}

function loginWithPhone(role) {
  const agreed = document.querySelector('#loginAgree');
  if (agreed && !agreed.checked) {
    showToast('请先阅读并同意服务协议与隐私政策');
    return;
  }
  if (role) state.role = role;
  state.user.loggedIn = true;
  closeLogin();
  refreshAllPrices();
  if (state.pendingCheckout) {
    state.pendingCheckout = false;
    openUtility('checkout');
    return showToast(`登录成功，以${roleName()}身份结算`);
  }
  switchTab('mine');
  showToast(`登录成功 · ${roleName()}身份`);
}

function switchRole() {
  state.role = state.role === 'B' ? 'C' : 'B';
  refreshAllPrices();
  showToast(state.role === 'B' ? '已切换为商家采购价' : '已切换为个人顾客价');
}

function refreshAllPrices() {
  renderDealList();
  renderGroupList();
  const page = activePageId();
  if (page === 'category') renderCategory();
  if (page === 'frequent') renderFrequent();
  if (page === 'cart') renderCart();
  if (page === 'mine') renderMine();
  if (page === 'detail') renderProductDetail();
  if (page === 'utility' && ['checkout', 'special', 'favorites', 'account', 'group'].includes(state.utilityKind)) renderUtility(state.utilityKind, state.utilityFilter);
  updateCartCount();
  refreshFeeRuleLabels();
}

function refreshFeeRuleLabels() {
  document.querySelectorAll('[data-fee-rule]').forEach(node => { node.textContent = `${roleName()}价 · ${feeRuleText()}`; });
}

let bannerSlides = [...document.querySelectorAll('.banner-slide')];
let bannerDots = [...document.querySelectorAll('[data-banner-slide]')];
let activeBanner = 0;
function showBanner(index) {
  if (!bannerSlides.length) return;
  activeBanner = (index + bannerSlides.length) % bannerSlides.length;
  bannerSlides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === activeBanner));
  bannerDots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === activeBanner));
}

async function loadRemoteHomeContent() {
  const api = window.MengshixianApi;
  if (!api || !api.config || api.config.provider !== 'cloudbase') return;
  const [bannerResult, sectionResult] = await Promise.all([
    api.content.getBanners({ platform: 'web', page: 1, pageSize: 10 }),
    api.content.getHomeSections({ platform: 'web', page: 1, pageSize: 30 })
  ]);
  if (bannerResult && bannerResult.ok && bannerResult.data && Array.isArray(bannerResult.data.rows) && bannerResult.data.rows.length) {
    const rows = bannerResult.data.rows;
    const mediaResult = await api.content.resolveMedia(rows.map((item) => item.mediaAssetId).filter(Boolean));
    const mediaMap = new Map(((mediaResult && mediaResult.ok && mediaResult.data && mediaResult.data.rows) || []).map((item) => [item._id, item]));
    const fallbackImages = ['../assets/products/frozen-hero-v2.png', '../assets/products/frozen-shrimp-pack-v2.png', '../assets/products/frozen-beef-pack-v2.png'];
    const banner = document.querySelector('.banner');
    if (banner) {
      banner.innerHTML = `${rows.map((item, index) => {
        const media = mediaMap.get(item.mediaAssetId) || {};
        const image = media.url || fallbackImages[index % fallbackImages.length];
        return `<article class="banner-slide${index === 0 ? ' is-active' : ''}"><img src="${image}" alt="${escapeText(item.title || '梦食鲜活动')}" onerror="this.src='${fallbackImages[index % fallbackImages.length]}'"><div class="banner-overlay"></div><div class="banner-copy"><small>梦食鲜冷链商城</small><h1>${escapeText(item.title || '鲜冻好物')}</h1><p>冷链配送，安心送到家</p></div></article>`;
      }).join('')}<div class="banner-dots" aria-label="轮播页码">${rows.map((_, index) => `<button class="${index === 0 ? 'is-active' : ''}" data-banner-slide="${index}" aria-label="第 ${index + 1} 张"></button>`).join('')}</div>`;
      bannerSlides = [...banner.querySelectorAll('.banner-slide')];
      bannerDots = [...banner.querySelectorAll('[data-banner-slide]')];
      activeBanner = 0;
    }
  }
  if (sectionResult && sectionResult.ok && sectionResult.data && Array.isArray(sectionResult.data.rows)) {
    const rows = sectionResult.data.rows;
    const news = rows.find((item) => item.moduleType === 'news');
    const special = rows.find((item) => item.moduleType === 'special');
    if (news) {
      const node = document.querySelector('.news-strip');
      if (node) { node.querySelector('b').textContent = news.title || '活动头条'; node.querySelector('em').textContent = news.subtitle || ''; node.querySelector('small').textContent = news.linkText || '更多'; }
    }
    if (special) {
      const title = document.querySelector('.deal-section .section-title h2');
      const subtitle = document.querySelector('.deal-section .section-title span');
      if (title) title.textContent = special.title || '特价专区';
      if (subtitle) subtitle.textContent = special.subtitle || '家庭囤货更省心';
    }
  }
}

async function loadRemoteCatalog() {
  const api = window.MengshixianApi;
  if (!api || !api.config || api.config.provider !== 'cloudbase') return;
  const result = await window.MengshixianCollection.fetchRemotePages(params => api.catalog.listProducts(params), { pageSize: LOCAL_PRODUCT_LIMIT, maxPages: 1 });
  if (!result.ok) { showToast('商品加载失败，请刷新重试'); return; }
  const rows = result.rows.slice(0, LOCAL_PRODUCT_LIMIT);
  const mediaMap = await resolveRemoteMedia(rows.map(item => item.coverMediaId));
  products = rows.map((item) => {
    const skuOptions = Array.isArray(item.skus) ? item.skus.map((sku) => ({ id: sku._id, label: sku.specName || sku.packageUnit || sku.netWeight || '默认规格', packageUnit: sku.packageUnit || '' })) : [];
    const image = mediaMap.get(item.coverMediaId);
    return {
      id: item._id,
      name: item.name || '未命名商品',
      category: item.categoryName || '其他冻品',
      unit: skuOptions[0] && skuOptions[0].packageUnit ? skuOptions[0].packageUnit : '规格待补充',
      packageUnit: skuOptions[0] ? skuOptions[0].packageUnit : '',
      specLabel: skuOptions[0] ? skuOptions[0].label : '',
      skuOptions,
      specs: skuOptions.map((sku) => sku.label),
      sales: 0,
      tag: '待补充',
      img: image && image.url ? image.url : 'placeholder.svg'
    };
  });
  Object.keys(groupDeals).forEach((id) => delete groupDeals[id]);
  state.cart = {};
  state.frequent = products.slice(0, 4).map((product) => product.id);
  renderDealList();
  renderGroupList();
  renderCategory();
  renderFrequent();
  renderCart();
  updateCartCount();
}

async function loadRemoteCategories() {
  const api = window.MengshixianApi;
  if (!api || !api.config || api.config.provider !== 'cloudbase') return;
  const result = await window.MengshixianCollection.fetchRemotePages(params => api.catalog.listCategories(params));
  if (!result.ok) { showToast('分类加载失败，请刷新重试'); return; }
  const rows = result.rows;
  const mediaMap = await resolveRemoteMedia(rows.map(item => item.imageMediaId));
  const fallbackImages = categoryPresentation.map((item) => item.image);
  const remotePresentation = rows.map((item, index) => ({
    id: item._id,
    label: item.name,
    image: (mediaMap.get(item.imageMediaId) || {}).url || fallbackImages[index % fallbackImages.length]
  })).filter((item) => item.label);
  categories = ['全部', ...remotePresentation.map((item) => item.label)];
  categoryGroups = remotePresentation.map((item) => ({ ...item, categories: [item.label] })).concat([
    { id: '全部', label: '全部分类', image: 'frozen-hero-v2.png', categories: categories.slice(1) }
  ]);
  state.category = '全部';
  state.categoryGroup = '全部';
  renderCategory();
}

async function resolveRemoteMedia(ids) {
  const result = new Map();
  for (const batch of window.MengshixianCollection.chunkUnique(ids, 50)) {
    const response = await window.MengshixianApi.content.resolveMedia(batch);
    if (response?.ok && Array.isArray(response.data?.rows)) {
      response.data.rows.forEach(item => result.set(item._id, item));
    }
  }
  return result;
}

function clearRemoteCatalogState() {
  if (window.MengshixianApi?.config.provider !== 'cloudbase') return;
  products = [];
  categories = ['全部'];
  categoryGroups = [];
  state.frequent = [];
  state.cart = {};
  Object.keys(groupDeals).forEach(id => delete groupDeals[id]);
}

document.addEventListener('click', event => {
  const target = event.target;
  const bannerDot = target.closest('[data-banner-slide]');
  if (bannerDot) return showBanner(Number(bannerDot.dataset.bannerSlide));
  const tab = target.closest('[data-tab]');
  if (tab) return switchTab(tab.dataset.tab);

  const categoryGroup = target.closest('[data-category-group]');
  if (categoryGroup) {
    state.categoryGroup = categoryGroup.dataset.categoryGroup;
    state.category = '全部';
    clearSearchInput();
    state.query = '';
    return renderCategory();
  }

  const category = target.closest('[data-category]');
  if (category) {
    state.category = category.dataset.category;
    clearSearchInput();
    state.query = '';
    if (state.category === '全部') state.categoryGroup = '全部';
    const matchingGroup = categoryGroups.find(group => group.categories.includes(state.category));
    if (matchingGroup) state.categoryGroup = matchingGroup.id;
    return switchTab('category');
  }

  const utility = target.closest('[data-utility]');
  if (utility) {
    const protectedPage = ['orders', 'coupon', 'address', 'account', 'favorites', 'trace', 'aftersale', 'invoice', 'invoiceHead', 'invoiceRecords', 'points', 'review', 'coldchain', 'group'].includes(utility.dataset.utility);
    if (protectedPage && !state.user.loggedIn) return openLogin();
    return openUtility(utility.dataset.utility, utility.dataset.orderFilter);
  }

  const filter = target.closest('[data-order-filter]');
  if (filter) return openUtility('orders', filter.dataset.orderFilter);

  const warehouse = target.closest('[data-warehouse]');
  if (warehouse) return selectWarehouse(warehouse.dataset.warehouse);

  const add = target.closest('[data-add]');
  if (add) return addToCart(add.dataset.add);

  const openGroup = target.closest('[data-open-group]');
  if (openGroup) {
    if (!state.user.loggedIn) return openLogin();
    return openUtility('group');
  }

  const product = target.closest('.product-trigger');
  if (product) return openProduct(product.dataset.product);

  const quantity = target.closest('[data-qty]');
  if (quantity) {
    const id = quantity.dataset.qty;
    state.cart[id] = Math.max(0, (state.cart[id] || 0) + Number(quantity.dataset.delta));
    updateCartCount();
    return renderCart();
  }

  const detailQty = target.closest('[data-detail-qty]');
  if (detailQty) {
    state.detailQty = Math.max(1, Math.min(99, state.detailQty + Number(detailQty.dataset.detailQty)));
    return renderProductDetail();
  }

  const spec = target.closest('[data-spec]');
  if (spec) {
    state.selectedSpecs[spec.dataset.spec] = spec.dataset.specValue;
    if (document.querySelector('[data-page="detail"]').classList.contains('is-active')) return renderProductDetail();
    return openProduct(spec.dataset.spec);
  }

  const action = target.closest('[data-action]')?.dataset.action;
  if (action === 'close-sheet' || action === 'detail-back') return closeProduct();
  if (action === 'utility-back') return returnFromUtility();
  if (action === 'close-login') return closeLogin();
  if (action === 'clear-cart') {
    const clearButton = target.closest('[data-action="clear-cart"]');
    if (!clearButton.classList.contains('is-armed')) {
      clearButton.classList.add('is-armed');
      clearButton.textContent = '确认清空？';
      setTimeout(() => {
        if (document.body.contains(clearButton)) {
          clearButton.classList.remove('is-armed');
          clearButton.textContent = '清空';
        }
      }, 2600);
      return;
    }
    clearButton.classList.remove('is-armed');
    clearButton.textContent = '清空';
    state.cart = {};
    updateCartCount();
    renderCart();
    return showToast('购物车已清空');
  }
  if (action === 'checkout') {
    if (!itemCount()) return showToast('请先添加商品再结算');
    if (!state.user.loggedIn) {
      state.pendingCheckout = true;
      return openLogin();
    }
    return openUtility('checkout');
  }
  if (action === 'detail-add') {
    addToCart(state.detailProductId, state.detailQty);
    return;
  }
  if (action === 'detail-checkout') {
    addToCart(state.detailProductId, state.detailQty);
    if (!state.user.loggedIn) {
      state.pendingCheckout = true;
      return openLogin();
    }
    return openUtility('checkout');
  }
  if (action === 'place-order') {
    if (!itemCount()) return showToast('购物车暂无可结算商品');
    const orderEntries = Object.entries(state.cart).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ product: byId(id), quantity })).filter(entry => entry.product);
    const orderSubtotal = orderEntries.reduce((sum, entry) => sum + priceOf(entry.product) * entry.quantity, 0);
    state.lastOrder = {
      total: orderSubtotal + deliveryFee(orderSubtotal),
      deliveryTime: state.delivery.eta,
      summary: `${orderEntries.slice(0, 2).map(entry => entry.product.name).join('、')}${orderEntries.length > 2 ? ` 等 ${orderEntries.length} 件商品` : ''}`
    };
    state.cart = {};
    updateCartCount();
    state.utilityStack = [];
    state.utilityReturnPage = 'home';
    openUtility('orders', '全部订单', true);
    return showToast('订单已创建，可在订单页查看状态');
  }
  if (action === 'add-frequent') {
    state.frequent.forEach(id => { state.cart[id] = (state.cart[id] || 0) + 1; });
    updateCartCount();
    renderCart();
    return showToast('常用商品已全部加入');
  }
  if (action === 'new-address') return showAddressForm();
  if (action === 'open-login') return openLogin();
  if (action === 'one-tap-login') return loginWithPhone(target.closest('[data-action="one-tap-login"]').dataset.role);
  if (action === 'switch-role') return switchRole();
  if (action === 'join-group') {
    const groupButton = target.closest('[data-action="join-group"]');
    const id = groupButton.dataset.group;
    if (state.groupJoined[id]) return showToast('已参团，等待成团');
    state.groupJoined[id] = true;
    groupDeals[id].joined += 1;
    renderUtility('group');
    renderGroupList();
    return showToast(groupDeals[id].joined >= groupDeals[id].size ? '拼团成功！将按拼团价安排发货' : '参团成功，等待更多人加入');
  }
  if (action === 'logout') {
    state.user.loggedIn = false;
    switchTab('mine');
    return showToast('已退出登录');
  }
  if (action === 'send-message') return sendChatMessage();
  if (action === 'apply-invoice') {
    state.invoice.applied = true;
    renderUtility('invoiceRecords');
    return showToast('开票申请已记录');
  }
  if (action === 'daily-checkin') {
    if (state.member.checkedIn) return showToast('今日已签到');
    state.member.checkedIn = true;
    state.member.points += 5;
    renderUtility('points');
    return showToast('签到成功，已获得 5 积分');
  }
  if (action === 'submit-review') {
    if (state.member.reviewed) return showToast('评价已提交');
    state.member.reviewed = true;
    state.member.points += 20;
    renderUtility('review');
    return showToast('评价已提交，积分已更新');
  }
  if (action === 'focus-search') {
    switchTab('home');
    document.querySelector('.search-row input').focus();
    return showToast('请输入想找的商品后按回车搜索');
  }
  if (action === 'start-search') return startSearch();
});

document.addEventListener('submit', event => {
  if (event.target.id === 'addressForm') {
    event.preventDefault();
    const form = new FormData(event.target);
    state.address = { name: String(form.get('name')).trim(), phone: String(form.get('phone')).trim(), detail: String(form.get('detail')).trim() };
    openUtility('address');
    showToast('收货地址已保存');
  }
  if (event.target.id === 'invoiceHeadForm') {
    event.preventDefault();
    const form = new FormData(event.target);
    state.invoice = { ...state.invoice, title: String(form.get('title')).trim(), email: String(form.get('email')).trim() };
    renderUtility('invoiceHead');
    showToast('发票抬头信息已保存');
  }
});

document.querySelector('.search-row input').addEventListener('keydown', event => {
  if (event.key === 'Enter') startSearch();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.matches('.chat-input input')) {
    event.preventDefault();
    sendChatMessage();
  }
});

clearRemoteCatalogState();
updateCartCount();
refreshDeliveryLabels();
updateClock();
setInterval(updateClock, 15000);
renderDealList();
renderGroupList();
renderCategory();
renderFrequent();
renderCart();
renderMine();
renderQuickCheckout();
loadRemoteHomeContent();
loadRemoteCatalog();
loadRemoteCategories();
if (bannerSlides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => showBanner(activeBanner + 1), 4500);
