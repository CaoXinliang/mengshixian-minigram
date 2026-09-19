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
const REMOTE_PAGE_SIZE = 100;
const REMOTE_MAX_PAGES = 50;

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
  tab: 'home', role: 'C', category: '全部', categoryGroup: '海鲜', query: '', cart: {}, frequent: [1, 2, 3, 4], selectedSpecs: {}, groupJoined: {},
  detailProductId: null, detailQty: 1, detailReturnPage: 'home', utilityReturnPage: 'mine', utilityKind: null, utilityFilter: '全部订单', utilityStack: [],
  pendingCheckout: false, lastOrder: null, remoteCheckoutQuote: null, remoteCheckoutPayload: null, remoteCheckoutAddress: null, remoteCheckoutStatus: 'idle', remoteCheckoutError: '', remoteOrderSubmitting: false, remoteOrderIdempotencyKey: '', remoteAcceptedQuoteToken: '', remoteCouponId: '', remoteCouponStatus: 'idle', remoteCouponError: '', inquiryAcceptKeys: {},
  delivery: { warehouse: '赣州仓', eta: '今天 18:30 前', feeRule: '满 99 元免基础配送费' },
  address: { name: '王女士', phone: '13800000000', detail: '江西省赣州市章贡区章江北大道 88 号 2 单元 702 室', area: '章贡区' },
  user: { loggedIn: false, phone: '' }, remoteUser: null, remoteIdentityStatus: 'idle', remoteIdentityError: '',
  member: { points: 268, checkedIn: false, reviewed: false },
  invoice: { title: '', email: '', applied: false },
  serviceMessages: [], remoteCartRows: [], remoteCartStatus: 'idle', remoteCartError: '', remoteCartBusy: {}, remoteAddresses: [], remoteAddressStatus: 'idle', remoteAddressError: '', remoteAddressEditingId: '', remoteDeliveryOptions: { warehouses: [], areas: [], slots: [], pickupSites: [] }, remoteDeliveryStatus: 'idle', remoteDeliveryError: '', remoteFulfillmentType: 'delivery', remoteWarehouseId: '', remoteDeliverySlotId: '', remotePickupSiteId: '', remotePaymentMethod: 'wechat',
  remoteCatalogStatus: 'idle', remoteCategoryStatus: 'idle', remoteCatalogError: '', remoteCategoryError: '',
  remotePrices: {}, remotePriceStatus: 'idle',
  detailStatus: 'idle', detailError: '', detailRequestId: 0,
  remoteOrders: [], remoteOrdersStatus: 'idle', remoteOrdersError: '', remoteOrderDetail: null, remoteOrderDetailId: '', remoteOrderDetailStatus: 'idle', remoteOrderDetailError: '',
  remoteRefunds: [], remoteRefundsStatus: 'idle', remoteRefundsError: '', remoteRefundDetail: null, remoteRefundDetailId: '', remoteRefundDetailStatus: 'idle', remoteRefundDetailError: '', aftersaleOrderId: '', aftersaleItemIndex: 0, aftersaleSubmitting: false, aftersaleFiles: [],
  businessFrequent: [], businessFrequentStatus: 'idle', businessFrequentError: '', procurementAccount: null, receivables: [], statements: [], procurementStatus: 'idle', procurementError: '', inquiries: [], inquiryDetail: null, inquiriesStatus: 'idle', inquiriesError: '', repurchasePreview: null, repurchaseOrderId: '', businessBusy: false,
  consumerStatus: {}, consumerError: {}, bundles: [], bundleQuote: null, groupCampaigns: [], myGroups: [], couponTemplates: [], coupons: [], favorites: [], pointsAccount: null, pointsLedger: [], membershipProfile: null, membershipLevel: null, reviewEligible: [], myReviews: [], invoiceTitles: [], invoices: [], storedValueAccount: null, storedValueLedger: [], consumerBusy: false
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
  return webMediaUrl(image, '../assets/products/placeholder.svg');
};
const detailVideoMarkup = product => {
  const video = String(product && product.video || '').trim();
  if (!video) {
    return '<div class="detail-video-empty"><b>该商品暂未上传视频</b><span>如需了解商品，可联系客服咨询</span></div>';
  }
  return `<div class="detail-video"><video src="${video}" poster="${product.videoPoster || productImageSrc(product)}" controls preload="none" playsinline></video></div><p class="detail-video-note">商品视频由商家上传，建议 Wi-Fi 环境观看</p>`;
};
const categoryImageSrc = image => {
  const value = String(image || 'categories/seafood.png');
  const rootProduct = value.match(/(?:^|\/)assets\/([^/]+)$/i);
  if (rootProduct) return `../assets/products/${rootProduct[1]}`;
  if (/^(https?:|data:|cloud:)/i.test(value)) return value;
  return value.includes('/') ? `../assets/${value}` : `../assets/products/${value}`;
};
/* 远端价格只消费 catalog.prices 的授权结果；客户端展示值不替代服务端 checkout.quote。 */
function priceOf(product, quantity = 1) {
  const remoteCent = unitPriceCentFor(product, quantity);
  if (Number.isFinite(remoteCent)) return remoteCent / 100;
  if (window.MengshixianApi?.config.provider === 'cloudbase') return NaN;
  return Number.isFinite(product.price) ? (state.role === 'B' ? Math.round(product.price * 0.8 * 10) / 10 : product.price) : 0;
}
const refPriceOf = product => (state.role === 'B' ? product.price : product.old);
const roleName = () => (state.role === 'B' ? '商家采购' : '个人顾客');
const isVerifiedBusiness = () => window.MengshixianApi?.config.provider === 'cloudbase'
  ? state.user.loggedIn && state.remoteUser?.userType === 'b' && state.remoteUser?.businessStatus === 'approved'
  : state.user.loggedIn && state.role === 'B';
const canSeePrice = () => window.MengshixianApi?.config.provider === 'cloudbase' && state.user.loggedIn && Object.keys(state.remotePrices).length > 0;
/* 未登录时价格位显示为登录引导 */
const priceHtml = (product, quantity = 1) => Number.isFinite(unitPriceCentFor(product, quantity))
  ? `<span>${money(unitPriceCentFor(product, quantity) / 100)}</span>`
  : `<span class="price-gate"${isRemoteCommerce() && !state.user.loggedIn ? ' data-action="open-login"' : ''}>${isRemoteCommerce() && !state.user.loggedIn ? '登录后查看价格' : '暂不可售'}</span>`;
const refPriceHtml = product => (canSeePrice() && Number.isFinite(refPriceOf(product)) ? `<del>${money(refPriceOf(product))}</del>` : '');
const productForSku = skuId => products.find(product => (product.skuOptions || []).some(sku => String(sku.id) === String(skuId)));
const skuForId = (product, skuId) => product?.skuOptions?.find(sku => String(sku.id) === String(skuId)) || null;
const isRemoteCommerce = () => window.MengshixianApi?.config.provider === 'cloudbase';
function remoteCartEntries() {
  return state.remoteCartRows.map(row => {
    const product = productForSku(row.skuId) || (row.product ? normalizeRemoteProduct(row.product, row.sku ? [normalizeRemoteSku(row.sku)] : [], '') : null);
    return { row, product, sku: skuForId(product, row.skuId) || (row.sku ? normalizeRemoteSku(row.sku) : null), quantity: Number(row.quantity || 0) };
  }).filter(entry => entry.quantity > 0);
}
const cartSubtotal = () => (isRemoteCommerce() ? remoteCartEntries().filter(entry => entry.row.selected !== false && !entry.row.unavailable) : Object.entries(state.cart).map(([id, quantity]) => ({ product: byId(id), quantity })))
  .reduce((sum, entry) => { const unit = entry.product ? priceOf(entry.product, entry.quantity) : NaN; return Number.isFinite(sum) && Number.isFinite(unit) ? sum + unit * entry.quantity : NaN; }, 0);
const deliveryFee = subtotal => (subtotal >= freightRule().free || subtotal <= 0 ? 0 : freightRule().fee);
const feeNote = subtotal => deliveryFee(subtotal) ? `配送费 ${money(deliveryFee(subtotal))}` : '已免配送费';
const itemCount = () => (isRemoteCommerce() ? state.remoteCartRows.map(item => Number(item.quantity || 0)) : Object.values(state.cart)).reduce((total, quantity) => total + quantity, 0);
const activePageId = () => document.querySelector('.page.is-active')?.dataset.page || 'home';
const maskedPhone = phone => String(phone).replace(/^(\d{3})\d+(\d{4})$/, '$1****$2');
const productPackage = product => product.packageUnit || product.unit || '规格待补充';
const productSpec = product => product.specLabel || '';
const productVariantsFor = product => product.skuOptions?.length
  ? product.skuOptions.map(option => option.label)
  : productVariants[product.id] || (productSpec(product) ? [productSpec(product)] : [productPackage(product)]);
const selectedUnit = product => state.selectedSpecs[product.id] || productVariantsFor(product)[0];
const selectedSku = product => product?.skuOptions?.find(option => option.label === selectedUnit(product)) || product?.skuOptions?.[0] || null;
const positiveInteger = (value, fallback = 1) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
const priceRuleFor = product => {
  const sku = selectedSku(product);
  return sku && state.remotePrices[String(sku.id)] || null;
};
const purchaseRuleFor = product => {
  const sku = selectedSku(product) || {};
  const priceRule = priceRuleFor(product) || {};
  return {
    minOrderQuantity: positiveInteger(priceRule.minOrderQuantity, positiveInteger(sku.minOrderQuantity, 1)),
    orderMultiple: positiveInteger(priceRule.orderMultiple, positiveInteger(sku.orderMultiple, 1))
  };
};
function normalizePurchaseQuantity(quantity, rule, direction = 'up') {
  const min = positiveInteger(rule?.minOrderQuantity, 1);
  const multiple = positiveInteger(rule?.orderMultiple, 1);
  const maxValid = Math.floor(999 / multiple) * multiple;
  if (maxValid < min) return 0;
  const requested = Math.max(0, Math.floor(Number(quantity) || 0));
  if (requested === 0 && direction === 'down') return 0;
  if (direction === 'down' && requested < min) return 0;
  const bounded = Math.max(min, requested);
  const adjusted = direction === 'down' ? Math.floor(bounded / multiple) * multiple : Math.ceil(bounded / multiple) * multiple;
  if (direction === 'down' && adjusted < min) return 0;
  return Math.min(maxValid, Math.max(min, adjusted));
}
function unitPriceCentFor(product, quantity = 1) {
  const priceRule = priceRuleFor(product);
  if (!priceRule || !Number.isFinite(Number(priceRule.amountCent))) return null;
  const tiers = Array.isArray(priceRule.quantityTiers) ? priceRule.quantityTiers : [];
  const count = positiveInteger(quantity, 1);
  const tier = tiers.find(item => count >= Number(item.minQuantity) && (item.maxQuantity === null || item.maxQuantity === undefined || count <= Number(item.maxQuantity)));
  return Number(tier && tier.amountCent !== undefined ? tier.amountCent : priceRule.amountCent);
}
const purchaseRuleText = product => {
  const rule = purchaseRuleFor(product);
  return `${rule.minOrderQuantity} 件起购 · 按 ${rule.orderMultiple} 件倍数购买`;
};
const tierPriceMarkup = (product, quantity) => {
  const priceRule = priceRuleFor(product);
  const tiers = Array.isArray(priceRule?.quantityTiers) ? priceRule.quantityTiers : [];
  if (!tiers.length) return '';
  return `<div class="quantity-tiers"><b>阶梯价</b>${tiers.map(item => {
    const active = quantity >= Number(item.minQuantity) && (item.maxQuantity === null || item.maxQuantity === undefined || quantity <= Number(item.maxQuantity));
    const range = item.maxQuantity === null || item.maxQuantity === undefined ? `${item.minQuantity} 件以上` : `${item.minQuantity}-${item.maxQuantity} 件`;
    return `<span class="${active ? 'is-active' : ''}">${range} ${money(Number(item.amountCent) / 100)}/件</span>`;
  }).join('')}</div>`;
};
const escapeText = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
function webMediaUrl(value, fallback) {
  const media = String(value || '').trim();
  if (!media) return fallback;
  const rootAsset = media.match(/(?:^|\/)assets\/([^/]+)$/i);
  if (rootAsset) return `../assets/products/${rootAsset[1]}`;
  if (/^(?:https?:|data:|blob:|cloud:|wxfile:)/i.test(media) || media.startsWith('../') || media.startsWith('./') || media.startsWith('/')) return media;
  if (media.startsWith('assets/')) return `../${media}`;
  if (!media.includes('/')) return `../assets/products/${media}`;
  return media;
}
const remoteStateMarkup = (title, message, action) => `<div class="remote-state" role="status"><b>${escapeText(title)}</b><span>${escapeText(message)}</span>${action ? `<button data-action="${action}">重新加载</button>` : ''}</div>`;

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

function invalidateRemoteQuote(clearAcceptedQuote = false) {
  state.remoteCheckoutQuote = null; state.remoteCheckoutPayload = null; state.remoteCheckoutStatus = 'idle'; state.remoteCheckoutError = ''; state.remoteOrderIdempotencyKey = '';
  if (clearAcceptedQuote) state.remoteAcceptedQuoteToken = '';
}

async function setRemoteCartQuantity(product, quantity, direction = 'up') {
  if (!state.user.loggedIn) { state.pendingCheckout = false; openLogin(); return false; }
  if (typeof window.MengshixianApi?.cart?.updateItem !== 'function' || typeof window.MengshixianApi?.cart?.removeItem !== 'function') { state.remoteCartError = '购物车服务暂不可用'; renderCart(); showToast(state.remoteCartError); return false; }
  const sku = selectedSku(product);
  if (!sku) { showToast('当前规格不可用'); return false; }
  const key = String(sku.id); const existing = state.remoteCartRows.find(item => String(item.skuId) === key);
  if (state.remoteCartBusy[key]) return false;
  const previousRows = state.remoteCartRows.map(item => ({ ...item }));
  const corrected = normalizePurchaseQuantity(quantity, purchaseRuleFor(product), direction);
  state.remoteCartBusy[key] = true; state.remoteCartError = '';
  if (corrected > 0) {
    const optimistic = { ...(existing || {}), _id: existing?._id || '', skuId: sku.id, quantity: corrected, selected: existing?.selected !== false, product: existing?.product || null, sku: existing?.sku || null };
    state.remoteCartRows = existing ? state.remoteCartRows.map(item => String(item.skuId) === key ? optimistic : item) : [...state.remoteCartRows, optimistic];
  } else state.remoteCartRows = state.remoteCartRows.filter(item => String(item.skuId) !== key);
  invalidateRemoteQuote(true); updateCartCount(); renderCart();
  const result = corrected > 0
    ? await window.MengshixianApi.cart.updateItem({ skuId: sku.id, quantity: corrected, selected: existing?.selected !== false })
    : await window.MengshixianApi.cart.removeItem(existing?._id || '');
  delete state.remoteCartBusy[key];
  if (!result?.ok) {
    state.remoteCartRows = previousRows; state.remoteCartError = result?.error?.message || '购物车更新失败'; updateCartCount(); renderCart(); showToast(`${state.remoteCartError}，可重试`); return false;
  }
  if (corrected > 0 && result.data?.item) {
    const serverItem = result.data.item;
    state.remoteCartRows = state.remoteCartRows.map(item => String(item.skuId) === key ? { ...item, ...serverItem } : item);
  } else if (corrected === 0) state.remoteCartRows = state.remoteCartRows.filter(item => String(item._id) !== String(result.data?.id) && String(item.skuId) !== key);
  state.remoteCartStatus = 'ready'; updateCartCount(); renderCart(); return true;
}
async function removeRemoteCartRow(itemId) {
  const existing = state.remoteCartRows.find(item => String(item._id) === String(itemId));
  if (!existing || state.remoteCartBusy[String(existing.skuId)]) return false;
  const previousRows = state.remoteCartRows.map(item => ({ ...item })); state.remoteCartBusy[String(existing.skuId)] = true;
  state.remoteCartRows = state.remoteCartRows.filter(item => item._id !== existing._id); invalidateRemoteQuote(true); updateCartCount(); renderCart();
  const result = await window.MengshixianApi.cart.removeItem(existing._id); delete state.remoteCartBusy[String(existing.skuId)];
  if (!result?.ok) { state.remoteCartRows = previousRows; state.remoteCartError = result?.error?.message || '移除失败'; updateCartCount(); renderCart(); showToast(`${state.remoteCartError}，可重试`); return false; }
  renderCart(); return true;
}
async function setRemoteCartSelected(itemId, selected) {
  const existing = state.remoteCartRows.find(item => String(item._id) === String(itemId)); if (!existing) return false;
  const previous = existing.selected !== false; existing.selected = selected; invalidateRemoteQuote(true); renderCart();
  const result = await window.MengshixianApi.cart.updateItem({ skuId: existing.skuId, quantity: Number(existing.quantity), selected });
  if (!result?.ok) { existing.selected = previous; state.remoteCartError = result?.error?.message || '勾选状态更新失败'; renderCart(); showToast(`${state.remoteCartError}，可重试`); return false; }
  Object.assign(existing, result.data?.item || {}); renderCart(); return true;
}

function addToCart(id, quantity = 1) {
  const product = byId(id);
  if (!product) return;
  const remoteItem = isRemoteCommerce() ? state.remoteCartRows.find(item => String(item.skuId) === String(selectedSku(product)?.id)) : null;
  const requested = (isRemoteCommerce() ? Number(remoteItem?.quantity || 0) : (state.cart[id] || 0)) + quantity;
  const corrected = normalizePurchaseQuantity(requested, purchaseRuleFor(product));
  if (!corrected) return showToast('该规格采购规则暂不可用，请联系客服');
  if (isRemoteCommerce()) return setRemoteCartQuantity(product, corrected).then(ok => { if (ok) showToast(corrected !== requested ? `已按采购规则调整为 ${corrected} 件` : (quantity > 1 ? `已加入购物车 ×${quantity}` : '已加入购物车')); });
  state.cart[id] = corrected;
  updateCartCount();
  renderCart();
  showToast(corrected !== requested ? `已按采购规则调整为 ${corrected} 件` : (quantity > 1 ? `已加入购物车 ×${quantity}` : '已加入购物车'));
}

function renderQuickCheckout() {
  const quickCheckout = document.querySelector('#quickCheckout');
  if (!quickCheckout) return;
  const activePage = document.querySelector('.page.is-active')?.dataset.page;
  const visible = ['home', 'category', 'frequent'].includes(activePage) && itemCount() > 0;
  quickCheckout.hidden = !visible;
  document.querySelector('.phone').classList.toggle('has-quick-checkout', visible);
  if (!visible) return;
  const rule = isRemoteCommerce() ? null : freightRule();
  const total = cartSubtotal();
  if (!canSeePrice() || !Number.isFinite(total)) {
    quickCheckout.innerHTML = `<button ${state.user.loggedIn ? '' : 'data-action="open-login"'}><img src="../assets/icons/cart.svg" alt="购物车"><span><b class="price-gate">${state.user.loggedIn ? '部分商品价格不可用' : '登录后查看价格'}</b><small>${itemCount()} 件商品 · ${roleName()}价</small></span></button><button data-action="checkout" ${state.user.loggedIn && !Number.isFinite(total) ? 'disabled' : ''}>去结算</button>`;
    return;
  }
  const hint = isRemoteCommerce() ? '运费以结算报价为准' : (total >= rule.free ? '已免配送费' : `差 ${money(rule.free - total)} 免配送费`);
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
  if (window.MengshixianApi?.config.provider === 'cloudbase' && state.remoteCatalogStatus !== 'ready') {
    dealView.innerHTML = state.remoteCatalogStatus === 'error'
      ? remoteStateMarkup('商品加载失败', state.remoteCatalogError || '请检查网络后重试', 'retry-catalog')
      : remoteStateMarkup('正在加载商品', '正在同步最新商品目录');
    return;
  }
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
  if (window.MengshixianApi?.config.provider === 'cloudbase' && state.remoteCatalogStatus !== 'ready') {
    document.querySelector('#categoryView').innerHTML = state.remoteCatalogStatus === 'error'
      ? remoteStateMarkup('商品目录加载失败', state.remoteCatalogError || '请检查网络后重试', 'retry-catalog')
      : remoteStateMarkup('正在加载商品目录', '商品与规格正在同步');
    return;
  }
  if (window.MengshixianApi?.config.provider === 'cloudbase' && state.remoteCategoryStatus !== 'ready') {
    document.querySelector('#categoryView').innerHTML = state.remoteCategoryStatus === 'error'
      ? remoteStateMarkup('分类加载失败', state.remoteCategoryError || '请检查网络后重试', 'retry-categories')
      : remoteStateMarkup('正在加载分类', '正在同步最新商品分类');
    return;
  }
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
  if (window.MengshixianApi?.config.provider === 'cloudbase') {
    const view = document.querySelector('#frequentView');
    if (!isVerifiedBusiness()) { view.innerHTML = remoteStateMarkup('企业采购专属', state.remoteIdentityStatus === 'loading' ? '正在核验企业身份' : '仅已认证企业采购账号可读取常购清单'); return; }
    if (state.businessFrequentStatus === 'loading') { view.innerHTML = remoteStateMarkup('正在加载常购清单', '请稍候'); return; }
    if (state.businessFrequentStatus === 'error') { view.innerHTML = remoteStateMarkup('常购清单加载失败', state.businessFrequentError, 'retry-business-frequent'); return; }
    view.innerHTML = `<div class="frequent-banner"><div><b>企业常购</b><span>数量与规格由服务端校验</span></div><button data-action="batch-add-frequent" ${state.businessBusy ? 'disabled' : ''}>${state.businessBusy ? '正在加购…' : '全部加购'}</button></div><div class="simple-list">${state.businessFrequent.map(item => { const product = byId(item.productId) || products.find(row => (row.skuOptions || []).some(sku => String(sku.id) === String(item.skuId))); return `<article class="simple-item"><img src="${productImageSrc(product || {})}" alt=""><div><h3>${escapeText(item.productName || product?.name || '商品')}</h3><p>${escapeText(item.specName || item.specSnapshot || selectedSku(product)?.label || item.skuId)} · 常购 ${Number(item.quantity || 1)} 件</p></div><button class="outline-add" data-remove-frequent="${escapeText(item._id)}">移除</button></article>`; }).join('') || '<div class="empty-state"><b>暂无常购商品</b><small>可在商品详情加入企业常购</small></div>'}</div>`;
    return;
  }
  const list = state.frequent.map(byId).filter(Boolean);
  document.querySelector('#frequentView').innerHTML = `
    <div class="frequent-banner"><div><b>常买好物</b><span>一键补齐冰箱库存</span></div><button data-action="add-frequent">全部加购</button></div>
    <div class="simple-list">${list.map(product => `<article class="simple-item product-trigger" data-product="${product.id}">
      <img src="${productImageSrc(product)}" alt="${product.name}"><div><h3>${product.name}</h3><p>${productPackage(product)} · ${product.category}</p><b>${priceHtml(product)}</b></div><button class="outline-add" data-add="${product.id}">加购</button>
    </article>`).join('')}</div>
  `;
}

async function loadBusinessFrequent() {
  if (!isVerifiedBusiness()) return;
  state.businessFrequentStatus = 'loading'; state.businessFrequentError = ''; renderFrequent();
  const result = await window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.frequent.list(params), { pageSize: 100, maxPages: REMOTE_MAX_PAGES });
  if (!isVerifiedBusiness()) return;
  if (!result?.ok) { state.businessFrequent = []; state.businessFrequentStatus = 'error'; state.businessFrequentError = result?.error?.message || '常购清单暂时无法读取'; }
  else { state.businessFrequent = result.rows; state.businessFrequentStatus = 'ready'; }
  renderFrequent();
}

function renderCart() {
  const cartView = document.querySelector('#cartView');
  if (isRemoteCommerce() && !state.user.loggedIn) { cartView.innerHTML = remoteStateMarkup('登录后查看购物车', '未登录不会读取购物车、价格或配送信息', 'open-login'); return; }
  if (isRemoteCommerce() && state.remoteCartStatus === 'loading') { cartView.innerHTML = remoteStateMarkup('正在加载购物车', '正在同步当前账号的商品'); return; }
  if (isRemoteCommerce() && state.remoteCartStatus === 'error' && !state.remoteCartRows.length) { cartView.innerHTML = remoteStateMarkup('购物车加载失败', state.remoteCartError || '请检查网络后重试', 'retry-cart'); return; }
  const entries = isRemoteCommerce() ? remoteCartEntries() : Object.entries(state.cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => ({ product: byId(id), quantity }))
    .filter(entry => entry.product);
  const pricedEntries = isRemoteCommerce() ? entries.filter(entry => entry.row.selected !== false && !entry.row.unavailable) : entries;
  const total = pricedEntries.reduce((sum, entry) => { const pricedProduct = entry.sku ? { ...entry.product, skuOptions: [entry.sku] } : entry.product; return sum + priceOf(pricedProduct, entry.quantity) * entry.quantity; }, 0);
  const completePrices = Number.isFinite(total);
  cartView.innerHTML = entries.length ? `
    ${state.remoteCartError ? `<div class="remote-inline-error" role="alert">${escapeText(state.remoteCartError)} <button data-action="retry-cart">重新加载</button></div>` : ''}<div class="delivery-note"><img src="../assets/icons/truck.svg" alt=""><div><b>${isRemoteCommerce() ? '配送方式与运费将在结算页确认' : state.delivery.eta}</b><small>${isRemoteCommerce() ? '商品金额、运费与优惠以服务端报价为准' : (canSeePrice() ? `${roleName()}价结算 · ${feeRuleText()}` : '登录后按身份展示价格与运费规则')}</small></div></div>
    <div class="cart-list">${entries.map(({ row, product, sku, quantity }) => { const pricedProduct = sku ? { ...product, skuOptions: [sku] } : product; const busy = isRemoteCommerce() && state.remoteCartBusy[String(row?.skuId)]; return `<article class="cart-item">
      ${isRemoteCommerce() ? `<label class="cart-select"><input type="checkbox" data-cart-selected="${escapeText(row?._id || '')}" ${row?.selected !== false ? 'checked' : ''} ${busy || row?.unavailable ? 'disabled' : ''}><span>选择</span></label>` : ''}<img src="${productImageSrc(product || {})}" alt="${escapeText(product?.name || '商品')}"><div class="cart-item-main"><h3>${escapeText(product?.name || row?.product?.name || '商品已失效')}</h3><p>${escapeText(sku?.label || (product ? selectedUnit(product) : '规格已失效'))}</p><small class="purchase-rule-hint">${row?.unavailable ? '商品已下架，可从购物车移除' : purchaseRuleText(pricedProduct)}</small><b>${row?.unavailable ? '<span class="price-gate">不可购买</span>' : priceHtml(pricedProduct, quantity)}</b>${row?.unavailable ? '' : tierPriceMarkup(pricedProduct, quantity)}</div>
      <div class="qty"><button data-qty="${escapeText(product?.id || '')}" data-sku-id="${escapeText(row?.skuId || sku?.id || '')}" data-cart-item-id="${escapeText(row?._id || '')}" data-delta="-1" ${busy ? 'disabled' : ''}>−</button><span>${quantity}</span><button data-qty="${escapeText(product?.id || '')}" data-sku-id="${escapeText(row?.skuId || sku?.id || '')}" data-cart-item-id="${escapeText(row?._id || '')}" data-delta="1" ${busy || row?.unavailable ? 'disabled' : ''}>+</button></div>
    </article>`; }).join('')}</div>
    <div class="cart-total"><span><small>${completePrices && pricedEntries.length ? `已选商品展示价 ${money(total)} · 运费与总额进入结算后由服务端报价` : '请选择有授权价格的可购买商品'}</small>${completePrices && pricedEntries.length ? `已选商品小计 <b>${money(total)}</b>` : '<b class="price-gate">暂不可结算</b>'}</span><button data-action="checkout" ${completePrices && pricedEntries.length ? '' : 'disabled'}>去结算</button></div>
  ` : `<div class="empty-state cart-empty"><img src="../assets/icons/cart.svg" alt=""><b>购物车还是空的</b><small>去首页挑一些喜欢的食材吧</small><button data-tab="home">去逛逛</button></div>`;
}

function renderMine() {
  if (!state.user.loggedIn) {
    if (state.remoteIdentityStatus === 'loading') { document.querySelector('#mineView').innerHTML = remoteStateMarkup('正在恢复网页会话', '请稍候'); return; }
    document.querySelector('#mineView').innerHTML = `
      <button class="guest-profile" data-action="open-login"><span class="guest-avatar"><img src="../assets/icons/user.svg" alt=""></span><span><b>登录 / 注册</b><small>登录后查看订单、优惠券和收货地址</small></span><i>›</i></button>
      ${state.remoteIdentityError ? `<div class="remote-state" role="alert"><b>网页会话不可用</b><span>${escapeText(state.remoteIdentityError)}</span><button data-action="open-login">重新登录</button></div>` : ''}<div class="service-list"><button data-utility="service"><img src="../assets/icons/headset.svg" alt=""><span>联系客服</span><b>在线 ›</b></button></div>`;
    return;
  }
  document.querySelector('#mineView').innerHTML = `
    <section class="consumer-profile"><div class="consumer-profile-head"><div class="avatar">鲜</div><div><b>梦食鲜顾客</b><span>${state.user.phone} · ${isVerifiedBusiness() ? '已认证企业采购' : '普通会员'}</span></div><button data-utility="account" aria-label="账户设置">⚙</button></div><div class="member-stats"><button data-utility="coupon"><b>3</b><span>优惠券</span></button><button data-utility="points"><b>${state.member.points}</b><span>积分</span></button><button data-utility="favorites"><b>4</b><span>我的收藏</span></button></div></section>
    <button class="new-member-banner" data-utility="coupon"><span>新客福利</span><b>领券后下单更省</b><i>去领取 ›</i></button>
    <div class="order-card"><div class="order-title"><b>我的订单</b><button data-utility="orders">全部订单 ›</button></div>
      <div class="order-grid">
        <button data-utility="orders" data-order-filter="待确认"><img src="../assets/icons/wallet.svg" alt=""><span>待确认</span>${state.lastOrder ? '<i>1</i>' : ''}</button>
        <button data-utility="orders" data-order-filter="待收货"><img src="../assets/icons/box.svg" alt=""><span>待收货</span></button>
        <button data-utility="orders" data-order-filter="售后/退款"><img src="../assets/icons/refresh.svg" alt=""><span>售后/退款</span></button>
        <button data-utility="review"><img src="../assets/icons/file.svg" alt=""><span>评价晒单</span></button>
      </div>
    </div>
    <section class="tool-panel"><h3>常用工具</h3><div class="consumer-tools"><button data-tab="frequent"><img src="../assets/icons/list.svg" alt="">常购清单</button>${isVerifiedBusiness() ? '<button data-utility="procurement"><img src="../assets/icons/wallet.svg" alt="">企业账期</button><button data-utility="inquiries"><img src="../assets/icons/file.svg" alt="">询价报价</button>' : ''}<button data-utility="bundles"><img src="../assets/icons/package.svg" alt="">套餐专区</button><button data-utility="group"><img src="../assets/icons/user.svg" alt="">我的拼团</button><button data-utility="favorites"><img src="../assets/icons/heart.svg" alt="">我的收藏</button><button data-utility="trace"><img src="../assets/icons/package.svg" alt="">食品溯源</button><button data-utility="aftersale"><img src="../assets/icons/refresh.svg" alt="">售后服务</button><button data-utility="invoice"><img src="../assets/icons/file.svg" alt="">电子发票</button><button data-utility="storedValue"><img src="../assets/icons/wallet.svg" alt="">储值账户</button><button data-utility="points"><img src="../assets/icons/coupon.svg" alt="">积分会员</button><button data-utility="review"><img src="../assets/icons/file.svg" alt="">评价晒单</button><button data-utility="address"><img src="../assets/icons/location.svg" alt="">收货地址</button><button data-utility="coldchain"><img src="../assets/icons/truck.svg" alt="">冷链保障</button><button data-utility="about"><img src="../assets/icons/user.svg" alt="">关于梦食鲜</button></div></section>
    <section class="tool-panel help-panel"><h3>帮助中心</h3><div class="consumer-tools two-tools"><button data-utility="faq"><img src="../assets/icons/headset.svg" alt="">常见问题</button><button data-utility="policy"><img src="../assets/icons/file.svg" alt="">服务条款</button></div></section>
    <section class="customer-panel"><b>客服中心</b><p>服务时间 08:00–22:00 · 冷链配送问题优先处理</p><button data-utility="service">联系在线客服 ›</button></section>
  `;
}

function openProduct(id) {
  const product = byId(id);
  if (!product) return;
  state.detailProductId = product.id;
  state.detailQty = normalizePurchaseQuantity(1, purchaseRuleFor(product));
  state.detailStatus = window.MengshixianApi?.config.provider === 'cloudbase' ? 'loading' : 'idle';
  state.detailError = '';
  if (!state.selectedSpecs[product.id]) state.selectedSpecs[product.id] = productVariantsFor(product)[0];
  state.detailReturnPage = activePageId();
  const detailPage = document.querySelector('[data-page="detail"]');
  pages.forEach(page => page.classList.toggle('is-active', page === detailPage));
  tabs.forEach(tab => tab.classList.remove('is-active'));
  document.querySelector('.tabbar').classList.add('is-hidden');
  renderQuickCheckout();
  renderProductDetail();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.MengshixianApi?.config.provider === 'cloudbase') loadRemoteProductDetail(product.id);
}

function renderProductDetail() {
  const product = byId(state.detailProductId);
  if (!product) return;
  if (state.detailStatus === 'error') {
    document.querySelector('#detailView').innerHTML = `
      <header class="detail-head"><button data-action="detail-back" aria-label="返回">‹</button><b>商品详情</b><button data-utility="service" aria-label="联系客服"><img src="../assets/icons/headset.svg" alt=""></button></header>
      ${remoteStateMarkup('商品详情加载失败', state.detailError || '请检查网络后重试', 'retry-detail')}`;
    return;
  }
  const variants = productVariantsFor(product);
  const selectedVariant = state.selectedSpecs[product.id] || variants[0];
  const purchaseRule = purchaseRuleFor(product);
  const details = [
    ['商品规格', selectedVariant],
    ['包装单位', product.packageUnit],
    ['品牌', product.brand],
    ['产地', product.origin],
    ['贮存条件', product.frozenTemperature || product.storageType],
    ['保质期', product.shelfLifeDays ? `${product.shelfLifeDays} 天` : '']
  ].filter(([, value]) => value);
  const detailImages = Array.isArray(product.detailImages) ? product.detailImages : [];
  document.querySelector('#detailView').innerHTML = `
    <header class="detail-head"><button data-action="detail-back" aria-label="返回">‹</button><b>商品详情</b><button data-utility="service" aria-label="联系客服"><img src="../assets/icons/headset.svg" alt=""></button></header>
    ${state.detailStatus === 'loading' ? '<div class="detail-loading" role="status">正在同步商品规格与媒体…</div>' : ''}
    <section class="detail-product"><div class="detail-photo"><img src="${productImageSrc(product)}" alt="${product.name}"><span>${product.tag}</span></div><div class="detail-summary"><h1>${product.name}</h1><p>${selectedVariant} · 月售 ${product.sales}${canSeePrice() ? ` · ${roleName()}价` : ''}</p><div><b>${priceHtml(product, state.detailQty)}</b>${refPriceHtml(product)}</div>${canSeePrice() ? '<p class="b-price-note">展示单价随数量更新，结算以服务端报价为准</p>' : ''}${groupOf(product.id) && !canSeePrice() ? '<p class="b-price-note">登录后可查看采购价与拼团价</p>' : ''}</div></section>
    <section class="detail-panel"><div class="detail-row"><b>选择规格</b><span>${selectedVariant}</span></div>${variants.length > 1 ? `<div class="detail-specs">${variants.map(variant => {
      const option = product.skuOptions?.find(item => item.label === variant) || {};
      return `<button class="${variant === selectedVariant ? 'is-active' : ''}" data-spec="${product.id}" data-spec-value="${variant}">${variant}<small>${positiveInteger(option.minOrderQuantity, 1)} 件起 · ${positiveInteger(option.orderMultiple, 1)} 件倍数</small></button>`;
    }).join('')}</div>` : ''}</section>
    ${groupOf(product.id) ? `<section class="detail-panel detail-group-panel"><div class="detail-row"><b>拼团专场</b><span class="group-tag">${groupOf(product.id).size} 人团</span></div><div class="group-summary"><div class="deal-price"><span>¥</span><b>${canSeePrice() ? money(groupOf(product.id).price) : '<span class="price-gate" data-action="open-login">登录后查看拼团价</span>'}</b>${canSeePrice() ? `<del>${money(product.price)}</del>` : ''}</div><small>${groupOf(product.id).ends} · 已参团 ${groupOf(product.id).joined}/${groupOf(product.id).size} 人 · 拼团价不分身份</small></div><button class="group-buy" type="button" data-open-group="${product.id}">${groupOf(product.id).joined >= groupOf(product.id).size ? '查看成团结果' : '去拼团'}</button></section>` : ''}
    <section class="detail-panel detail-qty"><div><b>购买数量</b><small class="purchase-rule-hint">${purchaseRuleText(product)}</small></div><div class="qty"><button data-detail-qty="-1" aria-label="减少数量" ${state.detailQty <= purchaseRule.minOrderQuantity ? 'disabled' : ''}>−</button><span data-detail-qty-value>${state.detailQty}</span><button data-detail-qty="1" aria-label="增加数量">+</button></div></section>
    ${tierPriceMarkup(product, state.detailQty) ? `<section class="detail-panel">${tierPriceMarkup(product, state.detailQty)}</section>` : ''}
    ${isVerifiedBusiness() ? `<section class="detail-panel"><div class="detail-row"><b>企业常购</b><button data-save-frequent="${escapeText(selectedSku(product)?.id || '')}" data-frequent-quantity="${state.detailQty}">加入常购清单</button></div></section>` : ''}
    <section class="detail-panel detail-service"><div><b>配送</b><span>${state.delivery.warehouse}冷链配送，预计送达时段：${state.delivery.eta}</span></div><div><b>服务</b><span>全程冷链，商品异常可申请售后</span></div></section>
    <section class="detail-panel"><h2>商品详情</h2><dl>${details.map(([label, value]) => `<div><dt>${escapeText(label)}</dt><dd>${escapeText(value)}</dd></div>`).join('')}<div><dt>温馨提示</dt><dd>开封后请尽快食用。配送时段以商家最终确认信息为准。</dd></div></dl>${detailImages.length ? `<div class="detail-media-gallery">${detailImages.map((url, index) => `<img src="${escapeText(url)}" alt="${escapeText(product.name)}详情图 ${index + 1}" loading="lazy">`).join('')}</div>` : ''}</section>
    <section class="detail-panel detail-video-panel"><h2>教学视频</h2>${detailVideoMarkup(product)}</section>
    <section class="detail-panel detail-origin"><h2>食材保障</h2><p>本商品由梦食鲜冷冻仓配发出，出库前完成包装与低温核验。</p><button data-utility="trace">查看食品溯源</button></section>
    ${isVerifiedBusiness() ? '<section class="detail-panel"><button class="wide-outline" data-action="save-business-frequent">加入企业常购</button></section>' : ''}${window.MengshixianApi?.config.provider === 'cloudbase' && state.user.loggedIn ? '<section class="detail-panel"><button class="wide-outline" data-action="save-favorite">收藏当前规格</button></section>' : ''}<div class="detail-actions"><button data-action="detail-add">加入购物车${Number.isFinite(unitPriceCentFor(product, state.detailQty)) ? `<small> ${money(priceOf(product, state.detailQty) * state.detailQty)}</small>` : ''}</button><button data-action="detail-checkout">立即结算</button></div>
  `;
}

function closeProduct() {
  state.detailRequestId += 1;
  state.detailStatus = 'idle';
  state.detailError = '';
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
  if (target === 'frequent') { renderFrequent(); if (window.MengshixianApi?.config.provider === 'cloudbase' && isVerifiedBusiness() && state.businessFrequentStatus === 'idle') loadBusinessFrequent(); }
  if (target === 'cart') renderCart();
  if (target === 'mine') renderMine();
  renderQuickCheckout();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const utilityTitles = { warehouse: '选择配送仓', activity: '活动头条', special: '特价专区', orders: '我的订单', orderDetail: '订单详情', aftersaleApply: '申请售后', refundDetail: '售后详情', procurement: '企业账期', inquiries: '询价中心', inquiryDetail: '询价详情', repurchase: '订单复购', bundles: '套餐专区', coupon: '优惠券', address: '收货地址', service: '联系客服', account: '账户信息', login: '手机号登录', checkout: '确认订单', favorites: '我的收藏', trace: '食品溯源', aftersale: '售后服务', invoice: '电子发票', invoiceHead: '发票抬头', invoiceRecords: '开票记录', points: '积分会员', review: '评价晒单', storedValue: '储值账户', coldchain: '冷链保障', about: '关于梦食鲜', faq: '常见问题', policy: '服务条款', group: '拼团专场' };

function utilityHead(kind, sub) {
  return `<div class="subpage-head utility-head"><button class="back-home" data-action="utility-back">‹</button><div><h2>${utilityTitles[kind]}</h2><small>${sub || ''}</small></div></div>`;
}

const remoteOrderStatusText = { pending_payment: '待支付', pending_confirmation: '待确认', picking: '拣货中', shipping: '配送中', delivered: '已送达', completed: '已完成', cancelled: '已取消' };
const remoteRefundStatusText = { requested: '待审核', approved: '审核通过', rejected: '已驳回', processing: '退款处理中', awaiting_manual_refund: '待人工提交退款', channel_pending: '已提交退款渠道', succeeded: '退款成功', failed: '退款失败' };
const remoteRefundStatus = refund => refund.status === 'succeeded' && refund.channelStatus !== 'succeeded' ? '退款结果待渠道核验' : (remoteRefundStatusText[refund.status] || refund.status || '—');
const centsMoney = value => `¥${(Number(value || 0) / 100).toFixed(2)}`;
const remoteTime = value => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '—';
function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`无法读取凭证文件：${file.name}`));
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.readAsDataURL(file);
  });
}
function renderRemoteOrders(filter) {
  if (!state.user.loggedIn) return remoteStateMarkup('请先登录', '登录后才能读取您的订单');
  if (state.remoteOrdersStatus === 'loading') return remoteStateMarkup('正在加载订单', '请稍候');
  if (state.remoteOrdersStatus === 'error') return remoteStateMarkup('订单加载失败', state.remoteOrdersError, 'retry-orders');
  const filterMap = { '待确认': ['pending_payment', 'pending_confirmation'], '待收货': ['picking', 'shipping', 'delivered'], '售后/退款': ['refund_requested', 'refunding', 'refunded'] };
  const allowed = filterMap[filter];
  const rows = allowed ? state.remoteOrders.filter(order => allowed.includes(order.status) || allowed.includes(order.refundStatus)) : state.remoteOrders;
  if (!rows.length) return `<div class="empty-state order-empty"><img src="../assets/icons/box.svg" alt=""><b>暂无订单</b><small>当前筛选下没有订单</small></div>`;
  return `<div class="order-history">${rows.map(order => `<article><div><b>订单 ${escapeText(order.orderNo || order._id)}</b><span>${escapeText(remoteOrderStatusText[order.status] || order.status || '—')}</span></div><p>${escapeText(order.fulfillmentType === 'pickup' ? `自提 · ${order.pickupSiteSnapshot?.name || '自提点待确认'}` : `配送 · ${order.deliverySlotSnapshot?.name || '时段待确认'}`)}</p><small>${remoteTime(order.createdAt)}</small><strong>${centsMoney(order.totalAmountCent)}</strong><button data-order-detail="${escapeText(order._id)}">查看详情</button></article>`).join('')}</div>`;
}
function orderTimelineMarkup(order) {
  const steps = order.fulfillmentType === 'pickup' ? [['pending_confirmation', '订单确认'], ['picking', '备货中'], ['delivered', '可自提'], ['completed', '已完成']] : [['pending_confirmation', '订单确认'], ['picking', '拣货中'], ['shipping', '配送中'], ['completed', '已完成']];
  const rank = steps.findIndex(([status]) => status === order.status);
  return `<div class="delivery-steps">${steps.map(([status, label], index) => `<span class="${index < rank ? 'is-done' : index === rank ? 'is-current' : ''}">${label}<small>${index < rank ? '已完成' : index === rank ? '进行中' : '待处理'}</small></span>`).join('')}</div>`;
}
function renderRemoteOrderDetail() {
  if (state.remoteOrderDetailStatus === 'loading') return utilityHead('orderDetail', '正在读取订单快照') + remoteStateMarkup('正在加载订单详情', '请稍候');
  if (state.remoteOrderDetailStatus === 'error') return utilityHead('orderDetail', '订单详情') + remoteStateMarkup('订单详情加载失败', state.remoteOrderDetailError, 'retry-order-detail');
  const detail = state.remoteOrderDetail;
  if (!detail?.order) return utilityHead('orderDetail', '订单详情') + remoteStateMarkup('订单不存在', '请返回订单列表重试');
  const order = detail.order; const items = Array.isArray(detail.items) ? detail.items : [];
  const fulfillment = order.fulfillmentType === 'pickup' ? order.pickupSiteSnapshot || {} : order.addressSnapshot || {};
  return utilityHead('orderDetail', `订单 ${escapeText(order.orderNo || order._id)}`) + `<section class="delivery-status"><div class="delivery-status-head"><div><span>${escapeText(remoteOrderStatusText[order.status] || order.status)}</span><b>${order.fulfillmentType === 'pickup' ? '到店自提' : '冷链配送'}</b></div></div>${orderTimelineMarkup(order)}</section><section class="after-card"><b>${order.fulfillmentType === 'pickup' ? '自提信息' : '配送信息'}</b><p>${escapeText(fulfillment.name || fulfillment.detail || '信息待确认')}</p><small>${escapeText(order.fulfillmentType === 'pickup' ? `${fulfillment.address || ''} ${fulfillment.openingHours || ''}` : `${fulfillment.detail || ''} ${order.deliverySlotSnapshot?.name || ''}`)}</small></section><section class="order-snapshot-list">${items.map((item, index) => `<article><div><b>${escapeText(item.productNameSnapshot || '商品')}</b><small>${escapeText(item.specSnapshot || item.packageUnitSnapshot || '')} · 实付 ${centsMoney(item.paidSubtotalCent === undefined ? item.subtotalCent : item.paidSubtotalCent)}</small></div><span>×${Number(item.quantity || 0)}</span><button data-aftersale-order="${escapeText(order._id)}" data-aftersale-item-index="${index}">申请售后</button></article>`).join('') || '<div class="empty">暂无商品快照</div>'}</section><section class="after-card"><b>金额信息</b><p>商品 ${centsMoney(order.pricingSnapshot?.goodsAmountCent)} · 运费 ${centsMoney(order.freightSnapshot?.amountCent)}</p><small>订单合计 ${centsMoney(order.totalAmountCent)} · 支付状态 ${escapeText(order.paymentStatus || '—')}</small></section>${isVerifiedBusiness() ? `<button class="wide-outline" data-repurchase-order="${escapeText(order._id)}">复购此订单</button>` : ''}<section class="after-card"><b>时间记录</b><p>创建：${remoteTime(order.createdAt)}</p><small>更新：${remoteTime(order.updatedAt)}</small></section>`;
}
function renderRemoteAftersale() {
  if (!state.user.loggedIn) return remoteStateMarkup('请先登录', '登录后才能读取售后记录');
  if (state.remoteRefundsStatus === 'loading') return remoteStateMarkup('正在加载售后记录', '请稍候');
  if (state.remoteRefundsStatus === 'error') return remoteStateMarkup('售后记录加载失败', state.remoteRefundsError, 'retry-refunds');
  const records = state.remoteRefunds.map(refund => `<section class="after-card"><b>售后单 ${escapeText(refund.refundNo || refund._id)}</b><p>${escapeText(remoteRefundStatus(refund))} · ${centsMoney(refund.amountCent)}</p><small>${escapeText(refund.reason || refund.reasonCode || '未填写原因')} · ${remoteTime(refund.createdAt)}</small><button data-refund-detail="${escapeText(refund._id)}">查看详情</button></section>`).join('');
  const eligible = state.remoteOrders.filter(order => !['cancelled'].includes(order.status));
  return `${eligible.length ? `<section class="after-card"><b>按订单申请售后</b><p>请选择需要处理的订单，再按商品填写数量与原因。</p>${eligible.map(order => `<button data-aftersale-order="${escapeText(order._id)}">订单 ${escapeText(order.orderNo || order._id)} · 申请售后</button>`).join('')}</section>` : ''}${records || '<div class="empty-state order-empty"><b>暂无售后记录</b><small>可从订单详情按商品申请</small></div>'}`;
}
function renderRemoteRefundDetail() {
  if (state.remoteRefundDetailStatus === 'loading') return utilityHead('refundDetail', '正在读取售后记录') + remoteStateMarkup('正在加载售后详情', '请稍候');
  if (state.remoteRefundDetailStatus === 'error') return utilityHead('refundDetail', '售后详情') + remoteStateMarkup('售后详情加载失败', state.remoteRefundDetailError, 'retry-refund-detail');
  const detail = state.remoteRefundDetail; const refund = detail?.refund || detail; const items = detail?.items || refund?.items || [];
  if (!refund?._id) return utilityHead('refundDetail', '售后详情') + remoteStateMarkup('售后记录不存在', '请返回售后列表重试');
  const refundSplit = refund.creditAdjustmentCent !== undefined || refund.cashRefundRequiredCent !== undefined
    ? `<section class="after-card"><b>退款拆分</b><p>账期应收冲减：${centsMoney(refund.creditAdjustmentCent)}</p><p>仍需原路退款：${centsMoney(refund.cashRefundRequiredCent)}</p><small>账期冲减以服务端账务流水为准，现金退款以渠道验签通知为准；售后退款不代表退货商品已经入库。</small></section>`
    : '';
  return utilityHead('refundDetail', `售后单 ${escapeText(refund.refundNo || refund._id)}`) + `<section class="after-card"><b>${escapeText(remoteRefundStatus(refund))}</b><p>退款通道：${escapeText(refund.channelStatus || '尚未提交')}</p><small>${refund.manualRefundRequired ? '等待运营人员提交退款渠道' : '最终退款结果以渠道验签通知为准'}</small></section>${refundSplit}<section class="order-snapshot-list">${items.map(item => `<article><div><b>${escapeText(item.productNameSnapshot || item.productName || '商品')}</b><small>${escapeText(item.specSnapshot || '')} · 本次申请 ${centsMoney(item.amountCent)} · 订单项实付 ${centsMoney(item.paidSubtotalCent === undefined ? item.amountCent : item.paidSubtotalCent)}</small></div><span>×${Number(item.quantity || 0)}</span></article>`).join('') || '<div class="empty">暂无商品明细</div>'}</section><section class="after-card"><b>申请说明</b><p>${escapeText(refund.reason || refund.reasonCode || '—')}</p><small>${escapeText(refund.description || '未填写')}</small></section>${(refund.mediaIds || []).length ? `<section class="after-card"><b>凭证素材</b><p>${refund.mediaIds.map(escapeText).join('、')}</p></section>` : ''}`;
}
function renderProcurement() {
  if (!isVerifiedBusiness()) return utilityHead('procurement', '') + remoteStateMarkup('无权查看企业账期', '仅已认证企业采购账号可以读取');
  if (state.procurementStatus === 'loading') return utilityHead('procurement', '') + remoteStateMarkup('正在加载企业账期', '请稍候');
  if (state.procurementStatus === 'error') return utilityHead('procurement', '') + remoteStateMarkup('企业账期加载失败', state.procurementError, 'retry-procurement');
  const account = state.procurementAccount || {};
  return utilityHead('procurement', '额度、占用与应收均来自服务端') + `<section class="member-stats procurement-summary"><div><b>${centsMoney(account.creditLimitCent)}</b><span>授信额度</span></div><div><b>${centsMoney(account.availableCent)}</b><span>可用额度</span></div><div><b>${centsMoney(account.occupiedCent)}</b><span>已占用</span></div><div><b>${centsMoney(account.receivableCent)}</b><span>应收</span></div></section><section class="after-card"><b>账期状态</b><p>${escapeText(account.status || '未开通')} · ${Number(account.paymentTermDays || 0)} 天账期</p><small>额度仅由后台审核配置，网页不会自行计算或修改。</small></section><section class="after-card"><b>应收流水</b>${state.receivables.map(item => `<p>${escapeText(item.action || item.receivableNo || item._id || '应收变动')} · ${centsMoney(item.amountCent)} · ${escapeText(item.status || '—')}</p>`).join('') || '<p>暂无应收记录</p>'}</section><section class="after-card"><b>对账单</b>${state.statements.map(item => `<p>${escapeText(item.statementNo || item.period || item._id || '对账单')} · ${centsMoney(item.amountCent || item.totalAmountCent)} · 未结 ${centsMoney(item.outstandingCent)} · ${escapeText(item.status || '—')}</p>`).join('') || '<p>暂无对账单</p>'}</section>`;
}
function inquiryQuote(inquiry) {
  const versions = inquiry?.quotes || inquiry?.quoteVersions || [];
  return inquiry?.latestQuote || [...versions].sort((left, right) => Number(right.version || 0) - Number(left.version || 0))[0] || inquiry?.quote || null;
}
function renderInquiries() {
  if (!isVerifiedBusiness()) return utilityHead('inquiries', '') + remoteStateMarkup('无权查看企业询价', '仅已认证企业采购账号可以读取');
  if (state.inquiriesStatus === 'loading') return utilityHead('inquiries', '') + remoteStateMarkup('正在加载询价', '请稍候');
  if (state.inquiriesStatus === 'error') return utilityHead('inquiries', '') + remoteStateMarkup('询价加载失败', state.inquiriesError, 'retry-inquiries');
  return utilityHead('inquiries', '报价以服务端最新有效版本为准') + `<form class="form-card aftersale-form" id="inquiryForm"><label>询价商品<textarea name="items" required placeholder="每行填写 SKU ID,数量"></textarea></label><label>采购说明<textarea name="description" maxlength="500" placeholder="交期、包装等要求"></textarea></label><button type="submit" ${state.businessBusy ? 'disabled' : ''}>提交询价</button></form><section class="after-card"><b>询价记录</b>${state.inquiries.map(item => `<p><button data-inquiry-detail="${escapeText(item._id)}">${escapeText(item.inquiryNo || item._id)} · ${escapeText(item.status || '—')} · 查看详情</button></p>`).join('') || '<p>暂无询价记录</p>'}</section>`;
}
function renderInquiryDetail() {
  const inquiry = state.inquiryDetail?.inquiry || state.inquiryDetail; const quotes = state.inquiryDetail?.quotes || inquiry?.quotes || []; const quote = inquiryQuote({ ...inquiry, quotes });
  if (state.inquiriesStatus === 'loading') return utilityHead('inquiryDetail', '') + remoteStateMarkup('正在加载询价详情', '请稍候');
  if (state.inquiriesStatus === 'error') return utilityHead('inquiryDetail', '') + remoteStateMarkup('询价详情加载失败', state.inquiriesError, 'retry-inquiry-detail');
  if (!inquiry?._id) return utilityHead('inquiryDetail', '') + remoteStateMarkup('询价不存在', '请返回询价列表');
  const expired = quote?.validUntil && new Date(quote.validUntil).getTime() <= Date.now();
  const acceptable = !expired && !quote?.temporary && quote?.source === 'client' && ['active', 'published', 'quoted'].includes(quote?.status || inquiry.status);
  return utilityHead('inquiryDetail', `询价 ${escapeText(inquiry.inquiryNo || inquiry._id)}`) + `<section class="after-card"><b>${escapeText(inquiry.status || '—')}</b><p>${escapeText(inquiry.description || '未填写采购说明')}</p></section><section class="order-snapshot-list">${(quote?.items || state.inquiryDetail?.items || inquiry.items || []).map(item => `<article><div><b>${escapeText(item.productName || item.skuId || '商品')}</b><small>报价单价 ${item.unitPriceCent === undefined ? '待报价' : centsMoney(item.unitPriceCent)}</small></div><span>×${Number(item.quantity || 0)}</span></article>`).join('') || '<div class="empty">暂无商品</div>'}</section>${quotes.length ? `<section class="after-card"><b>历史报价版本</b>${quotes.map(item => `<p>V${Number(item.version || 1)} · ${centsMoney(item.totalAmountCent)} · ${escapeText(item.status || '—')} · 有效至 ${remoteTime(item.validUntil)}</p>`).join('')}</section>` : ''}${quote ? `<section class="after-card"><b>当前报价 V${Number(quote.version || 1)}</b><p>合计 ${centsMoney(quote.totalAmountCent)}</p><small>有效期至 ${remoteTime(quote.validUntil)}${quote.temporary ? ' · AI/临时报价，需后台复核启用' : ''}</small>${!acceptable ? `<p>${expired ? '该报价已过期' : '该报价尚未正式复核发布'}，不能接受</p>` : `<button data-accept-quote="${escapeText(quote._id || quote.quoteId)}" data-inquiry-id="${escapeText(inquiry._id)}" data-version="${Number(quote.version || 1)}" data-accept-destination="cart">接受并转入购物车</button><button data-accept-quote="${escapeText(quote._id || quote.quoteId)}" data-inquiry-id="${escapeText(inquiry._id)}" data-version="${Number(quote.version || 1)}" data-accept-destination="checkout">接受并去结算</button>`}</section>` : '<section class="after-card"><b>等待报价</b><p>运营人员报价后会生成带有效期的新版本。</p></section>'}`;
}
function renderRepurchase() {
  if (!isVerifiedBusiness()) return utilityHead('repurchase', '') + remoteStateMarkup('无权复购', '仅已认证企业采购账号可以使用');
  if (state.businessBusy && !state.repurchasePreview) return utilityHead('repurchase', '') + remoteStateMarkup('正在校验原订单商品', '请稍候');
  const preview = state.repurchasePreview || {}; const valid = preview.addedItems || preview.validItems || preview.items || []; const invalid = preview.invalidItems || [];
  return utilityHead('repurchase', '失效商品不会加入购物车') + `<section class="after-card"><b>可复购商品</b>${valid.map(item => `<p>${escapeText(item.productName || item.skuId || '商品')} ×${Number(item.quantity || 0)}</p>`).join('') || '<p>没有可复购商品</p>'}</section><section class="after-card"><b>失效项</b>${invalid.map(item => `<p>${escapeText(item.productName || item.skuId || '商品')} · ${escapeText(item.reason || item.code || '当前不可购')}</p>`).join('') || '<p>没有失效项</p>'}</section>${valid.length ? `<button class="wide-outline" data-action="commit-repurchase" ${state.businessBusy ? 'disabled' : ''}>确认加入购物车</button>` : ''}`;
}
function renderAftersaleForm() {
  if (state.remoteOrderDetailStatus === 'loading') return utilityHead('aftersaleApply', '按商品申请') + remoteStateMarkup('正在准备售后申请', '正在读取订单商品');
  if (state.remoteOrderDetailStatus === 'error') return utilityHead('aftersaleApply', '按商品申请') + remoteStateMarkup('订单商品读取失败', state.remoteOrderDetailError, 'retry-aftersale-order');
  const detail = state.remoteOrderDetail; const items = Array.isArray(detail?.items) ? detail.items : [];
  if (!detail?.order || String(detail.order._id) !== String(state.aftersaleOrderId)) return utilityHead('aftersaleApply', '按商品申请') + remoteStateMarkup('正在准备售后申请', '正在读取订单商品');
  return utilityHead('aftersaleApply', `订单 ${escapeText(detail.order.orderNo || detail.order._id)}`) + `<form class="form-card aftersale-form" id="aftersaleForm">${items.map((item, index) => `<label class="aftersale-item"><input type="checkbox" name="selectedItem" value="${index}" ${index === state.aftersaleItemIndex ? 'checked' : ''}><span>${escapeText(item.productNameSnapshot || '商品')} · ${escapeText(item.specSnapshot || '')} · 订单项实付 ${centsMoney(item.paidSubtotalCent === undefined ? item.subtotalCent : item.paidSubtotalCent)}</span><input name="quantity-${index}" type="number" min="1" max="${Number(item.quantity || 1)}" value="1" aria-label="售后数量"></label>`).join('')}<label>售后原因<select name="reasonCode" required><option value="quality_issue">质量问题</option><option value="missing_item">漏发少件</option><option value="delivery_damage">配送破损</option><option value="other">其他</option></select></label><label>问题说明<textarea name="description" maxlength="500" required placeholder="请描述商品问题"></textarea></label><label>凭证素材 ID<textarea name="mediaIds" placeholder="每行一个已有素材 ID，最多 9 个"></textarea></label><label>选择凭证图片<input id="aftersaleFiles" type="file" accept="image/*" multiple></label><small class="upload-prep-note">${state.aftersaleFiles.length ? `已选择 ${state.aftersaleFiles.length} 个本地文件；提交时将先安全上传。 <button type="button" data-action="clear-aftersale-files">取消选图</button>` : '可选择最多 9 张图片；提交申请前会先取得素材 ID。'}</small><button type="submit" ${state.aftersaleSubmitting ? 'disabled' : ''}>${state.aftersaleSubmitting ? '正在提交…' : '提交售后申请'}</button></form>`;
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
  if (window.MengshixianApi?.config.provider === 'cloudbase' && state.user.loggedIn) {
    if (kind === 'orders') loadRemoteOrders();
    if (kind === 'aftersale') loadRemoteAftersaleData();
    if (kind === 'procurement') loadProcurement();
    if (kind === 'inquiries') loadInquiries();
    if (['bundles', 'group', 'coupon', 'favorites', 'points', 'review', 'invoice', 'invoiceHead', 'invoiceRecords', 'storedValue'].includes(kind)) loadConsumerUtility(kind);
    if (kind === 'address' && state.remoteAddressStatus === 'idle') loadRemoteAddresses();
    if (kind === 'checkout') {
      const commerceLoad = ['idle', 'error'].includes(state.remoteCartStatus) || ['idle', 'error'].includes(state.remoteAddressStatus) || ['idle', 'error'].includes(state.remoteDeliveryStatus) ? loadRemoteCommerce() : Promise.resolve();
      const couponLoad = ['idle', 'error'].includes(state.remoteCouponStatus) ? loadCheckoutCoupons() : Promise.resolve();
      Promise.all([commerceLoad, couponLoad]).then(refreshRemoteCheckoutQuote);
    }
  }
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

function renderRemoteAddressBook() {
  if (state.remoteAddressStatus === 'loading') return utilityHead('address', '管理配送地址') + remoteStateMarkup('正在加载收货地址', '请稍候');
  if (state.remoteAddressStatus === 'error') return utilityHead('address', '管理配送地址') + remoteStateMarkup('地址加载失败', state.remoteAddressError, 'retry-addresses');
  return utilityHead('address', '地址资料仅用于当前账号履约') + `<div class="address-list">${state.remoteAddresses.map(item => `<article class="address-card"><b>${escapeText(item.name)} <small>${escapeText(item.phoneMasked || '')}</small></b><p>${escapeText(item.detail)}</p><span>${escapeText(item.regionCode)}${item.tag ? ` · ${escapeText(item.tag)}` : ''}${item.isDefault ? ' · 默认地址' : ''}</span><div class="address-actions"><button data-edit-address="${escapeText(item._id)}">编辑</button>${item.isDefault ? '' : `<button data-default-address="${escapeText(item._id)}">设为默认</button>`}<button data-delete-address="${escapeText(item._id)}">删除</button></div></article>`).join('') || '<div class="empty-state"><b>暂无收货地址</b><small>新增地址后才能使用冷链配送</small></div>'}</div><button class="wide-outline" data-action="new-address">新增收货地址</button>`;
}

function renderRemoteCheckout() {
  if (!state.user.loggedIn) return utilityHead('checkout', '安全结算') + remoteStateMarkup('请先登录', '未登录不会读取购物车、地址或价格', 'open-login');
  if (state.remoteCartStatus === 'loading' || state.remoteAddressStatus === 'loading' || state.remoteDeliveryStatus === 'loading') return utilityHead('checkout', '安全结算') + remoteStateMarkup('正在准备结算', '正在同步购物车、地址与配送选项');
  const prerequisiteError = state.remoteCartError || state.remoteAddressError || state.remoteDeliveryError;
  if (prerequisiteError) return utilityHead('checkout', '安全结算') + remoteStateMarkup('结算资料加载失败', prerequisiteError, 'retry-commerce');
  normalizeRemoteSelections();
  const address = selectedRemoteAddress(); const warehouses = eligibleRemoteWarehouses(address); const slots = eligibleRemoteSlots(); const sites = state.remoteDeliveryOptions.pickupSites;
  const quote = state.remoteCheckoutQuote;
  const selector = `<section class="checkout-options"><div class="fulfillment-switch"><button data-fulfillment="delivery" class="${state.remoteFulfillmentType === 'delivery' ? 'is-active' : ''}">冷链配送</button><button data-fulfillment="pickup" class="${state.remoteFulfillmentType === 'pickup' ? 'is-active' : ''}">到店自提</button></div>${state.remoteFulfillmentType === 'delivery' ? `${address ? `<label>收货地址<select id="remoteCheckoutAddress">${state.remoteAddresses.map(item => `<option value="${escapeText(item._id)}" ${item._id === address._id ? 'selected' : ''}>${escapeText(item.name)} · ${escapeText(item.detail)}</option>`).join('')}</select></label>` : '<div class="remote-inline-error">没有可用收货地址 <button data-action="new-address">立即新增</button></div>'}<label>配送仓库<select id="remoteCheckoutWarehouse">${warehouses.map(item => `<option value="${escapeText(item._id)}" ${item._id === state.remoteWarehouseId ? 'selected' : ''}>${escapeText(item.name)}</option>`).join('')}</select></label><label>配送时段<select id="remoteCheckoutSlot"><option value="">由商家确认</option>${slots.map(item => `<option value="${escapeText(item._id)}" ${item._id === state.remoteDeliverySlotId ? 'selected' : ''}>${escapeText(item.name)} ${escapeText(item.startTime || '')}-${escapeText(item.endTime || '')}</option>`).join('')}</select></label>` : `<label>自提点<select id="remoteCheckoutPickup">${sites.map(item => `<option value="${escapeText(item._id)}" ${item._id === state.remotePickupSiteId ? 'selected' : ''}>${escapeText(item.name)} · ${escapeText(item.address)}</option>`).join('')}</select></label>${state.remotePickupSiteId ? `<small>${escapeText(sites.find(item => item._id === state.remotePickupSiteId)?.openingHours || '营业时间待确认')}</small>` : '<div class="remote-inline-error">暂无可用自提点</div>'}`}</section>`;
  const paymentChoices = isVerifiedBusiness() ? [['wechat', '微信支付'], ['offline', '线下结算'], ['credit', '企业账期']] : [['wechat', '微信支付']];
  if (!paymentChoices.some(([value]) => value === state.remotePaymentMethod)) state.remotePaymentMethod = 'wechat';
  const paymentOptions = paymentChoices.map(([value, label]) => `<option value="${value}" ${state.remotePaymentMethod === value ? 'selected' : ''}>${label}</option>`).join('');
  const availableCoupons = state.coupons.filter(item => item.status === 'available');
  const couponSelector = state.remoteCouponStatus === 'loading' ? '<small class="checkout-safe-note">正在读取可用优惠券…</small>' : state.remoteCouponStatus === 'error' ? `<div class="remote-inline-error">${escapeText(state.remoteCouponError)}，当前报价未使用优惠券。 <button data-action="retry-checkout-coupons">重试</button></div>` : availableCoupons.length ? `<label class="checkout-payment">优惠券<select id="remoteCheckoutCoupon"><option value="">不使用优惠券</option>${availableCoupons.map(item => `<option value="${escapeText(item._id)}" ${state.remoteCouponId === item._id ? 'selected' : ''}>${escapeText(item.snapshot?.name || item.name || '可用优惠券')}</option>`).join('')}</select></label>` : '<small class="checkout-safe-note">当前没有可用优惠券</small>';
  const quoteBody = state.remoteCheckoutStatus === 'loading' ? remoteStateMarkup('正在获取结算报价', '正在校验价格、库存、运费与优惠') : state.remoteCheckoutStatus === 'error' ? remoteStateMarkup('报价失败', state.remoteCheckoutError || '请重试', 'retry-checkout-quote') : quote ? `<section class="checkout-products">${(quote.items || []).map(item => `<article><div><b>${escapeText(item.productNameSnapshot || item.skuId)}</b><span>${escapeText(item.specSnapshot || '')}</span></div><strong>${centsMoney(item.unitPriceCent)} × ${Number(item.quantity)}</strong></article>`).join('')}</section><section class="checkout-breakdown"><p>商品金额 <b>${centsMoney(quote.goodsAmountCent)}</b></p>${Number(quote.discountAmountCent || 0) ? `<p>优惠 <b>-${centsMoney(quote.discountAmountCent)}</b></p>` : ''}<p>运费 <b>${centsMoney(quote.freightAmountCent)}</b></p><strong>应付 ${centsMoney(quote.payableAmountCent)}</strong></section>${couponSelector}<label class="checkout-payment">结算方式<select id="remotePaymentMethod">${paymentOptions}</select></label>${state.remoteCheckoutError ? `<div class="remote-inline-error" role="alert">${escapeText(state.remoteCheckoutError)}</div>` : ''}<button class="place-order" data-action="place-order" ${state.remoteOrderSubmitting ? 'disabled' : ''}>${state.remoteOrderSubmitting ? '正在提交订单…' : '提交订单'}</button><small class="checkout-safe-note">下单时会再次由服务端校验报价和库存；重复点击不会生成重复订单。</small>` : '<button class="place-order" data-action="retry-checkout-quote">获取结算报价</button>';
  return utilityHead('checkout', '价格、运费与应付总额只采用服务端报价') + selector + quoteBody;
}

function renderUtility(kind, filter = '全部订单') {
  let body = '';
  const remoteConsumerBody = renderRemoteConsumerUtility(kind);
  if (remoteConsumerBody !== null) {
    document.querySelector('#utilityView').innerHTML = remoteConsumerBody;
    return;
  }
  if (kind === 'login') {
    body = utilityHead(kind, '网页登录') + remoteStateMarkup('请使用正式网页账号登录', '账号由运营人员为现有用户开通');
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
    body = utilityHead(kind, '订单状态与配送进度') + (window.MengshixianApi?.config.provider === 'cloudbase' ? `
      <div class="category-chips">${labels.map(label => `<button class="${label === filter ? 'is-active' : ''}" data-order-filter="${label}">${label}</button>`).join('')}</div>${renderRemoteOrders(filter)}` : `
      <div class="category-chips">${labels.map(label => `<button class="${label === filter ? 'is-active' : ''}" data-order-filter="${label}">${label}</button>`).join('')}</div>
      <div class="order-history">${latestOrder}</div>`);
  }
  if (kind === 'orderDetail') body = renderRemoteOrderDetail();
  if (kind === 'refundDetail') body = renderRemoteRefundDetail();
  if (kind === 'procurement') body = renderProcurement();
  if (kind === 'inquiries') body = renderInquiries();
  if (kind === 'inquiryDetail') body = renderInquiryDetail();
  if (kind === 'repurchase') body = renderRepurchase();
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
  if (kind === 'address' && isRemoteCommerce()) body = renderRemoteAddressBook();
  if (kind === 'address' && !isRemoteCommerce()) {
    body = utilityHead(kind, '管理配送地址') + `
      <div class="address-card"><b>${state.address.name} <small>${maskedPhone(state.address.phone)}</small></b><p>${state.address.detail}</p><span>${state.address.area} · 可配送 · 默认地址</span></div>
      <button class="wide-outline" data-action="new-address">编辑收货地址</button>`;
  }
  if (kind === 'checkout' && isRemoteCommerce()) body = renderRemoteCheckout();
  if (kind === 'checkout' && window.MengshixianApi?.config.provider !== 'cloudbase') {
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
      <div class="account-summary"><div class="avatar">鲜</div><b>梦食鲜顾客</b><span>${roleName()}身份 · 身份由服务端账号决定</span></div>
      <form class="form-card" id="webPasswordForm"><label>当前密码<input name="currentPassword" type="password" autocomplete="current-password" minlength="10" required></label><label>新密码<input name="newPassword" type="password" autocomplete="new-password" minlength="10" required></label><label>确认新密码<input name="confirmPassword" type="password" autocomplete="new-password" minlength="10" required></label><button type="submit">修改登录密码</button></form>
      <div class="setting-list"><button data-utility="coupon">我的优惠券 <b>›</b></button><button data-utility="address">收货地址 <b>›</b></button><button data-utility="service">联系客服 <b>›</b></button><button data-action="logout">退出登录 <b>›</b></button></div>`;
  }
  if (kind === 'favorites') {
    body = utilityHead(kind, '收藏的食材降价会提醒您') + `<div class="simple-list">${products.slice(0, 4).map(product => `<article class="simple-item product-trigger" data-product="${product.id}"><img src="${productImageSrc(product)}" alt="${product.name}"><div><h3>${product.name}</h3><p>${productPackage(product)} · ${product.category}</p><b>${priceHtml(product)}</b></div><button class="outline-add" data-add="${product.id}">加购</button></article>`).join('')}</div>`;
  }
  if (kind === 'trace') {
    const traceProduct = byId(state.detailProductId) || byId(2);
    body = utilityHead(kind, '每一份冻品都有可查来源') + `<section class="trace-card"><b>${traceProduct.name}</b><span>展示批次：待批次数据录入</span><div><i>✓</i><p><strong>原料验收</strong><small>低温入库信息将在批次资料完善后展示</small></p></div><div><i>✓</i><p><strong>分拣包装</strong><small>出库前完成包装与低温核验</small></p></div><div><i>✓</i><p><strong>配送信息</strong><small>配送状态将在商家确认后展示</small></p></div></section><button class="wide-outline" data-utility="orders">查看订单</button>`;
  }
  if (kind === 'aftersale') {
     body = utilityHead(kind, '质量、漏发或配送问题可申请售后') + (window.MengshixianApi?.config.provider === 'cloudbase' ? renderRemoteAftersale() : `<section class="after-card"><b>售后申请说明</b><p>已完成订单可提交对应商品的售后申请。</p><small>当前没有历史售后记录。</small><button data-utility="service">咨询售后</button></section><section class="after-card"><b>售后进度</b><p>暂无售后申请</p><button data-utility="faq">查看售后说明</button></section>`);
  }
  if (kind === 'aftersaleApply') body = renderAftersaleForm();
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

async function loadRemoteOrders() {
  if (!state.user.loggedIn) { state.remoteOrders = []; state.remoteOrdersStatus = 'idle'; return; }
  state.remoteOrdersStatus = 'loading'; state.remoteOrdersError = '';
  if (state.utilityKind === 'orders') renderUtility('orders', state.utilityFilter);
  const result = await window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.orders.list(params), { pageSize: 100, maxPages: REMOTE_MAX_PAGES });
  if (!state.user.loggedIn) return;
  if (!result?.ok || !Array.isArray(result.rows)) {
    state.remoteOrders = []; state.remoteOrdersStatus = 'error'; state.remoteOrdersError = result?.error?.message || '订单暂时无法读取';
  } else { state.remoteOrders = result.rows; state.remoteOrdersStatus = 'ready'; }
  if (state.utilityKind === 'orders') renderUtility('orders', state.utilityFilter);
}
async function fetchRemoteOrderDetail(orderId) {
  if (!state.user.loggedIn) return false;
  state.remoteOrderDetailId = orderId;
  state.remoteOrderDetailStatus = 'loading'; state.remoteOrderDetailError = ''; state.remoteOrderDetail = null;
  const response = await window.MengshixianApi.orders.get(orderId);
  if (!state.user.loggedIn) return false;
  if (!response?.ok || !response.data?.order || !Array.isArray(response.data?.items)) {
    state.remoteOrderDetailStatus = 'error'; state.remoteOrderDetailError = response?.error?.message || '订单详情暂时无法读取'; return false;
  }
  state.remoteOrderDetail = { order: response.data.order, items: response.data.items };
  state.remoteOrderDetailStatus = 'ready'; return true;
}
async function openRemoteOrderDetail(orderId) {
  state.remoteOrderDetailId = orderId;
  state.remoteOrderDetailStatus = 'loading'; state.remoteOrderDetailError = ''; state.remoteOrderDetail = null;
  openUtility('orderDetail');
  await fetchRemoteOrderDetail(orderId);
  if (state.utilityKind === 'orderDetail') renderUtility('orderDetail');
}
async function prepareAftersale(orderId, itemIndex = 0) {
  state.aftersaleOrderId = orderId; state.aftersaleItemIndex = Number(itemIndex) || 0; state.aftersaleFiles = [];
  state.remoteOrderDetailStatus = 'loading'; state.remoteOrderDetailError = ''; state.remoteOrderDetail = null;
  openUtility('aftersaleApply');
  const loaded = await fetchRemoteOrderDetail(orderId);
  if (state.utilityKind === 'aftersaleApply') renderUtility('aftersaleApply');
  return loaded;
}
async function loadRemoteRefunds() {
  if (!state.user.loggedIn) { state.remoteRefunds = []; state.remoteRefundsStatus = 'idle'; return; }
  state.remoteRefundsStatus = 'loading'; state.remoteRefundsError = '';
  const result = await window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.refunds.list(params), { pageSize: 100, maxPages: REMOTE_MAX_PAGES });
  if (!state.user.loggedIn) return;
  if (!result?.ok || !Array.isArray(result.rows)) {
    state.remoteRefunds = []; state.remoteRefundsStatus = 'error'; state.remoteRefundsError = result?.error?.message || '售后记录暂时无法读取';
  } else { state.remoteRefunds = result.rows; state.remoteRefundsStatus = 'ready'; }
}
async function openRemoteRefundDetail(refundId) {
  if (!state.user.loggedIn) return;
  state.remoteRefundDetailId = refundId; state.remoteRefundDetail = null; state.remoteRefundDetailStatus = 'loading'; state.remoteRefundDetailError = '';
  openUtility('refundDetail');
  const response = await window.MengshixianApi.refunds.get(refundId);
  if (!state.user.loggedIn) return;
  if (!response?.ok || !response.data) {
    state.remoteRefundDetailStatus = 'error'; state.remoteRefundDetailError = response?.error?.message || '售后详情暂时无法读取';
  } else { state.remoteRefundDetail = response.data; state.remoteRefundDetailStatus = 'ready'; }
  if (state.utilityKind === 'refundDetail') renderUtility('refundDetail');
}
async function loadRemoteAftersaleData() {
  state.remoteRefundsStatus = 'loading';
  if (state.utilityKind === 'aftersale') renderUtility('aftersale');
  await Promise.all([loadRemoteOrders(), loadRemoteRefunds()]);
  if (state.utilityKind === 'aftersale') renderUtility('aftersale');
}
async function loadProcurement() {
  if (!isVerifiedBusiness()) return;
  state.procurementStatus = 'loading'; state.procurementError = ''; if (state.utilityKind === 'procurement') renderUtility('procurement');
  const [account, receivables, statements] = await Promise.all([
    window.MengshixianApi.procurement.getAccount(),
    window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.procurement.listReceivables(params), { pageSize: 100, maxPages: REMOTE_MAX_PAGES }),
    window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.procurement.listStatements(params), { pageSize: 100, maxPages: REMOTE_MAX_PAGES })
  ]);
  if (!isVerifiedBusiness()) return;
  if (!account?.ok || !receivables?.ok || !statements?.ok) { state.procurementStatus = 'error'; state.procurementError = account?.error?.message || '企业账期暂时无法读取'; }
  else { state.procurementAccount = account.data?.account || account.data; state.receivables = receivables.rows; state.statements = statements.rows; state.procurementStatus = 'ready'; }
  if (state.utilityKind === 'procurement') renderUtility('procurement');
}
async function loadInquiries() {
  if (!isVerifiedBusiness()) return;
  state.inquiriesStatus = 'loading'; state.inquiriesError = ''; if (state.utilityKind === 'inquiries') renderUtility('inquiries');
  const result = await window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.inquiries.list(params), { pageSize: 100, maxPages: REMOTE_MAX_PAGES });
  if (!isVerifiedBusiness()) return;
  if (!result?.ok) { state.inquiries = []; state.inquiriesStatus = 'error'; state.inquiriesError = result?.error?.message || '询价记录暂时无法读取'; }
  else { state.inquiries = result.rows; state.inquiriesStatus = 'ready'; }
  if (state.utilityKind === 'inquiries') renderUtility('inquiries');
}
const consumerKindKey = kind => ['invoice', 'invoiceHead', 'invoiceRecords'].includes(kind) ? 'invoice' : kind;
async function remoteRows(call) {
  return window.MengshixianCollection.fetchRemotePages(call, { pageSize: 100, maxPages: REMOTE_MAX_PAGES });
}
async function loadConsumerUtility(kind) {
  if (!state.user.loggedIn || window.MengshixianApi?.config.provider !== 'cloudbase') return;
  const key = consumerKindKey(kind);
  state.consumerStatus[key] = 'loading'; state.consumerError[key] = '';
  if (consumerKindKey(state.utilityKind) === key) renderUtility(state.utilityKind);
  let results = [];
  try {
    if (key === 'bundles') results = [await remoteRows(params => window.MengshixianApi.bundles.list(params))];
    if (key === 'group') results = await Promise.all([remoteRows(params => window.MengshixianApi.groups.campaigns(params)), remoteRows(params => window.MengshixianApi.groups.mine(params))]);
    if (key === 'coupon') results = await Promise.all([remoteRows(params => window.MengshixianApi.coupons.templates(params)), remoteRows(params => window.MengshixianApi.coupons.list(params))]);
    if (key === 'favorites') results = [await remoteRows(params => window.MengshixianApi.favorites.list(params))];
    if (key === 'points') results = await Promise.all([window.MengshixianApi.points.account(), remoteRows(params => window.MengshixianApi.points.ledger(params)), window.MengshixianApi.membership.profile()]);
    if (key === 'review') results = await Promise.all([remoteRows(params => window.MengshixianApi.reviews.eligible(params)), remoteRows(params => window.MengshixianApi.reviews.mine(params))]);
    if (key === 'invoice') results = await Promise.all([remoteRows(params => window.MengshixianApi.invoiceTitles.list(params)), remoteRows(params => window.MengshixianApi.invoices.list(params))]);
    if (key === 'storedValue') results = await Promise.all([window.MengshixianApi.storedValue.account(), remoteRows(params => window.MengshixianApi.storedValue.ledger(params))]);
    if (!state.user.loggedIn) return;
    const failed = results.find(result => !result?.ok);
    if (failed) throw new Error(failed.error?.message || '数据暂时无法读取');
    if (key === 'bundles') state.bundles = results[0].rows;
    if (key === 'group') { state.groupCampaigns = results[0].rows; state.myGroups = results[1].rows; }
    if (key === 'coupon') { state.couponTemplates = results[0].rows; state.coupons = results[1].rows; }
    if (key === 'favorites') state.favorites = results[0].rows;
    if (key === 'points') { state.pointsAccount = results[0].data?.account || null; state.pointsLedger = results[1].rows; state.membershipProfile = results[2].data?.profile || null; state.membershipLevel = results[2].data?.level || null; }
    if (key === 'review') { state.reviewEligible = results[0].rows; state.myReviews = results[1].rows; }
    if (key === 'invoice') { state.invoiceTitles = results[0].rows; state.invoices = results[1].rows; }
    if (key === 'storedValue') { state.storedValueAccount = results[0].data?.account || null; state.storedValueLedger = results[1].rows; }
    state.consumerStatus[key] = 'ready';
  } catch (error) { state.consumerStatus[key] = 'error'; state.consumerError[key] = error.message || '数据暂时无法读取'; }
  if (consumerKindKey(state.utilityKind) === key) renderUtility(state.utilityKind);
}
function renderRemoteConsumerUtility(kind) {
  if (window.MengshixianApi?.config.provider !== 'cloudbase' || !['bundles', 'group', 'coupon', 'favorites', 'points', 'review', 'invoice', 'invoiceHead', 'invoiceRecords', 'storedValue'].includes(kind)) return null;
  if (!state.user.loggedIn) return utilityHead(kind, '') + remoteStateMarkup('请先登录', '登录后才能读取您的账户数据');
  const key = consumerKindKey(kind); const status = state.consumerStatus[key] || 'idle';
  if (status !== 'ready') return utilityHead(kind, '') + (status === 'error' ? remoteStateMarkup(`${utilityTitles[kind]}加载失败`, state.consumerError[key], `retry-consumer-${key}`) : remoteStateMarkup(`正在加载${utilityTitles[kind]}`, '请稍候'));
  if (kind === 'bundles') return utilityHead(kind, '套餐明细与优惠均由服务端报价') + `${state.bundleQuote ? `<section class="after-card"><b>${escapeText(state.bundleQuote.bundleSnapshot?.name || '套餐报价')}</b><p>原商品合计 ${centsMoney(state.bundleQuote.originalGoodsAmountCent)} · 套餐优惠 ${centsMoney(state.bundleQuote.bundleDiscountCent)}</p><small>最终结算仍以服务端下单校验为准</small></section>` : ''}<div class="order-history">${state.bundles.map(bundle => `<article><div><b>${escapeText(bundle.name)}</b><span>${escapeText(bundle.status || '')}</span></div><p>${escapeText(bundle.description || '')}</p><small>${(bundle.items || []).map(item => `${escapeText(item.skuId)} ×${Number(item.quantity || 0)}`).join('、')}</small><strong>${bundle.bundlePriceCent === undefined ? '登录后报价' : centsMoney(bundle.bundlePriceCent)}</strong><button data-bundle-quote="${escapeText(bundle._id)}">获取服务端报价</button></article>`).join('') || '<div class="empty-state"><b>暂无可用套餐</b></div>'}</div>`;
  if (kind === 'group') return utilityHead(kind, '拼团资格、人数和退款待办均由服务端判断') + `<section class="after-card"><b>可参与活动</b>${state.groupCampaigns.map(item => `<p>${escapeText(item.title || item.name || item._id)} · ${Number(item.groupSize || 0)} 人团 <button data-create-group="${escapeText(item._id)}">发起拼团</button></p>`).join('') || '<p>暂无活动</p>'}</section><section class="after-card"><b>我的拼团</b>${state.myGroups.map(row => { const item = row.group || row; return `<p>${escapeText(item.groupNo || item._id)} · ${escapeText(item.status || '—')} · ${Number(item.memberCount || 0)}/${Number(item.groupSize || 0)} 人</p>`; }).join('') || '<p>暂无拼团记录</p>'}</section><small>需要支付的参团订单只有在微信支付通道配置完成后才能创建；页面不会伪造支付或退款成功。</small>`;
  if (kind === 'coupon') return utilityHead(kind, '领取与可用状态以服务端为准') + `<section class="after-card"><b>可领取优惠券</b>${state.couponTemplates.map(item => `<p>${escapeText(item.name)} · ${item.type === 'percent' ? `${Number(item.discountRateBps || 0) / 100} 折` : centsMoney(item.discountCent)} <button data-claim-coupon="${escapeText(item._id)}">领取</button></p>`).join('') || '<p>暂无可领取优惠券</p>'}</section><section class="after-card"><b>我的优惠券</b>${state.coupons.map(item => `<p>${escapeText(item.snapshot?.name || item.templateName || item._id)} · ${escapeText(item.status || '—')} · 有效至 ${remoteTime(item.validTo || item.snapshot?.validTo)}</p>`).join('') || '<p>暂无优惠券</p>'}</section>`;
  if (kind === 'favorites') return utilityHead(kind, 'B/C 登录账号均可使用，数据彼此隔离') + `<div class="simple-list">${state.favorites.map(item => { const product = byId(item.productId) || products.find(row => (row.skuOptions || []).some(sku => String(sku.id) === String(item.skuId))); return `<article class="simple-item"><img src="${productImageSrc(product || {})}" alt=""><div><h3>${escapeText(item.productName || product?.name || '商品')}</h3><p>${escapeText(item.specName || item.skuId || '')}</p></div><button class="outline-add" data-remove-favorite="${escapeText(item._id)}">移除</button></article>`; }).join('') || '<div class="empty-state"><b>暂无收藏</b></div>'}</div>${state.favorites.length ? '<button class="wide-outline" data-action="batch-add-favorites">全部加入购物车</button>' : ''}`;
  if (kind === 'points') return utilityHead(kind, '积分与会员等级来自服务端') + `<section class="points-hero"><b>${Number(state.pointsAccount?.balance || state.pointsAccount?.points || 0)}</b><span>${escapeText(state.membershipLevel?.name || state.membershipProfile?.levelName || '普通会员')}</span><button data-action="remote-daily-checkin" ${state.consumerBusy ? 'disabled' : ''}>每日签到</button></section><div class="activity-list"><b>积分流水</b>${state.pointsLedger.map(item => `<p>${escapeText(item.reason || item.action || '积分变动')} · ${Number(item.change || 0) > 0 ? '+' : ''}${Number(item.change || 0)}</p>`).join('') || '<p>暂无积分流水</p>'}</div>`;
  if (kind === 'review') return utilityHead(kind, '评价提交后进入审核，不会立即公开') + `<form class="form-card" id="remoteReviewForm"><label>可评价商品<select name="eligible" required>${state.reviewEligible.map(item => `<option value="${escapeText(item.orderId)}|${escapeText(item.orderItemId)}">${escapeText(item.orderNo || item.orderId)} · ${escapeText(item.productNameSnapshot || item.productName || item.skuId)}</option>`).join('')}</select></label><label>评分<input name="rating" type="number" min="1" max="5" required value="5"></label><label>评价内容<input name="content" required maxlength="500"></label><label>媒体 ID（逗号分隔）<input name="mediaIds"></label><button type="submit" ${state.consumerBusy || !state.reviewEligible.length ? 'disabled' : ''}>提交评价审核</button></form><section class="after-card"><b>我的评价</b>${state.myReviews.map(item => `<p>${Number(item.rating || 0)} 星 · ${escapeText(item.content || '')} · ${escapeText(item.status || 'pending')}</p>`).join('') || '<p>暂无评价</p>'}</section>`;
  if (kind === 'invoice') return utilityHead(kind, '开票主体与服务商状态以后台处理结果为准') + `<section class="invoice-hero"><b>电子发票</b><span>未配置开票服务商时只会进入待人工处理，不会显示已开票</span></section><button class="invoice-entry" data-utility="invoiceHead"><span>▧</span><div><b>发票抬头管理</b><small>${state.invoiceTitles.length} 个抬头</small></div><i>›</i></button><button class="invoice-entry" data-utility="invoiceRecords"><span>☷</span><div><b>开票记录</b><small>${state.invoices.length} 条申请</small></div><i>›</i></button>`;
  if (kind === 'invoiceHead') return utilityHead(kind, '企业税号等资料只提交到服务端') + `<form class="form-card" id="remoteInvoiceTitleForm"><label>类型<select name="type"><option value="personal">个人</option><option value="company">企业</option></select></label><label>抬头名称<input name="name" required maxlength="100"></label><label>税号<input name="taxNo" maxlength="40"></label><label>地址<input name="address" maxlength="200"></label><label>开户行<input name="bankName" maxlength="100"></label><label>银行账号<input name="bankAccount" maxlength="80"></label><button type="submit">保存抬头</button></form><section class="after-card"><b>已有抬头</b>${state.invoiceTitles.map(item => `<p>${escapeText(item.name)} · ${escapeText(item.type)} <button data-delete-invoice-title="${escapeText(item._id)}">删除</button></p>`).join('') || '<p>暂无抬头</p>'}</section>`;
  if (kind === 'invoiceRecords') return utilityHead(kind, '仅已完成且满足条件的订单可申请') + `<form class="form-card" id="remoteInvoiceRequestForm"><label>订单 ID<input name="orderId" required maxlength="80"></label><label>发票抬头<select name="titleId" required>${state.invoiceTitles.map(item => `<option value="${escapeText(item._id)}">${escapeText(item.name)}</option>`).join('')}</select></label><label>接收邮箱<input name="email" type="email"></label><button type="submit" ${!state.invoiceTitles.length ? 'disabled' : ''}>提交开票申请</button></form><section class="after-card"><b>开票记录</b>${state.invoices.map(item => `<p>${escapeText(item.invoiceNo || item._id)} · ${escapeText(item.status || 'requested')}${item.status === 'provider_unconfigured' ? ' · 服务商未配置' : ''}</p>`).join('') || '<p>暂无开票记录</p>'}</section>`;
  if (kind === 'storedValue') return utilityHead(kind, '当前仅验证储值意向，不接入真实资金') + `<section class="account-summary"><b>${centsMoney(state.storedValueAccount?.balanceCent)}</b><span>储值余额 · ${escapeText(state.storedValueAccount?.status || 'test_only')}</span></section><form class="form-card" id="topupIntentForm"><label>测试充值意向（元）<input name="amount" type="number" min="0.01" step="0.01" required></label><button type="submit">检查充值通道</button></form><section class="after-card"><b>储值流水</b>${state.storedValueLedger.map(item => `<p>${escapeText(item.action || item.reason || '余额变动')} · ${centsMoney(item.amountCent)}</p>`).join('') || '<p>暂无流水</p>'}</section><small>支付通道未配置时，服务端只返回 unavailable，绝不会增加余额。</small>`;
  return null;
}
async function openInquiryDetail(id) {
  if (!isVerifiedBusiness()) return;
  state.inquiryDetail = null; state.inquiriesStatus = 'loading'; state.inquiryDetailId = id; openUtility('inquiryDetail');
  const result = await window.MengshixianApi.inquiries.get(id);
  if (!isVerifiedBusiness()) return;
  if (!result?.ok) { state.inquiriesStatus = 'error'; state.inquiriesError = result?.error?.message || '询价详情暂时无法读取'; }
  else { state.inquiryDetail = result.data; state.inquiriesStatus = 'ready'; }
  if (state.utilityKind === 'inquiryDetail') renderUtility('inquiryDetail');
}
async function openRepurchase(orderId) {
  if (!isVerifiedBusiness()) return showToast('仅已认证企业采购账号可以复购');
  state.repurchaseOrderId = orderId; state.repurchasePreview = null; state.businessBusy = true; openUtility('repurchase');
  const result = await window.MengshixianApi.repurchase.preview(orderId);
  state.businessBusy = false;
  if (!result?.ok) { renderUtility('repurchase'); return showToast(result?.error?.message || '复购校验失败'); }
  state.repurchasePreview = result.data; renderUtility('repurchase');
}
function applyAddedItems(addedItems) {
  (Array.isArray(addedItems) ? addedItems : []).forEach(item => {
    const product = products.find(row => (row.skuOptions || []).some(sku => String(sku.id) === String(item.skuId)));
    if (product) state.cart[product.id] = Number(item.quantity || state.cart[product.id] || 0);
  });
  updateCartCount(); renderCart();
  if (isRemoteCommerce() && state.user.loggedIn) return loadRemoteCart();
}

function selectedRemoteAddress() { return state.remoteAddresses.find(item => item._id === state.remoteCheckoutAddress?._id) || state.remoteAddresses.find(item => item.isDefault) || state.remoteAddresses[0] || null; }
function deliveryAreaFor(address, warehouseId) { return state.remoteDeliveryOptions.areas.find(area => (area.regionCodes || []).includes(address?.regionCode) && (!(area.warehouseIds || []).length || area.warehouseIds.includes(warehouseId))) || null; }
function eligibleRemoteWarehouses(address = selectedRemoteAddress()) {
  return state.remoteDeliveryOptions.warehouses.filter(warehouse => deliveryAreaFor(address, warehouse._id));
}
function eligibleRemoteSlots() {
  const area = deliveryAreaFor(selectedRemoteAddress(), state.remoteWarehouseId);
  return state.remoteDeliveryOptions.slots.filter(slot => (!slot.warehouseId || slot.warehouseId === state.remoteWarehouseId) && (!slot.deliveryAreaId || slot.deliveryAreaId === area?._id));
}
function eligiblePickupSites() { return state.remoteDeliveryOptions.pickupSites.filter(site => !state.remoteWarehouseId || site.warehouseId === state.remoteWarehouseId); }
function normalizeRemoteSelections() {
  state.remoteCheckoutAddress = selectedRemoteAddress();
  if (state.remoteFulfillmentType === 'delivery') {
    const warehouses = eligibleRemoteWarehouses();
    if (!warehouses.some(item => item._id === state.remoteWarehouseId)) state.remoteWarehouseId = warehouses[0]?._id || '';
    const slots = eligibleRemoteSlots();
    if (!slots.some(item => item._id === state.remoteDeliverySlotId)) state.remoteDeliverySlotId = slots[0]?._id || '';
    state.remotePickupSiteId = '';
  } else {
    const sites = state.remoteDeliveryOptions.pickupSites;
    if (!sites.some(item => item._id === state.remotePickupSiteId)) state.remotePickupSiteId = sites[0]?._id || '';
    const site = sites.find(item => item._id === state.remotePickupSiteId);
    state.remoteWarehouseId = site?.warehouseId || '';
    state.remoteDeliverySlotId = '';
  }
}
async function loadRemoteCart() {
  if (!isRemoteCommerce() || !state.user.loggedIn) return;
  state.remoteCartStatus = 'loading'; state.remoteCartError = ''; renderCart();
  const result = await window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.cart.get(params), { pageSize: 100, maxPages: REMOTE_MAX_PAGES });
  if (!state.user.loggedIn) return;
  if (!result?.ok) { state.remoteCartStatus = 'error'; state.remoteCartError = result?.error?.message || '购物车暂时无法读取'; }
  else { state.remoteCartRows = result.rows; state.remoteCartStatus = 'ready'; state.remoteCartError = ''; }
  invalidateRemoteQuote(true); updateCartCount(); renderCart(); renderQuickCheckout();
}
async function loadRemoteAddresses() {
  if (!isRemoteCommerce() || !state.user.loggedIn) return;
  state.remoteAddressStatus = 'loading'; state.remoteAddressError = '';
  if (state.utilityKind === 'address' || state.utilityKind === 'checkout') renderUtility(state.utilityKind);
  const result = await window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.address.list(params), { pageSize: 100, maxPages: 2 });
  if (!state.user.loggedIn) return;
  if (!result?.ok) { state.remoteAddressStatus = 'error'; state.remoteAddressError = result?.error?.message || '收货地址暂时无法读取'; }
  else { state.remoteAddresses = result.rows; state.remoteAddressStatus = 'ready'; state.remoteAddressError = ''; normalizeRemoteSelections(); }
  invalidateRemoteQuote(); if (state.utilityKind === 'address' || state.utilityKind === 'checkout') renderUtility(state.utilityKind);
}
async function loadRemoteDeliveryOptions() {
  if (!isRemoteCommerce() || !state.user.loggedIn) return;
  state.remoteDeliveryStatus = 'loading'; state.remoteDeliveryError = '';
  const result = await window.MengshixianApi.delivery.options();
  if (!state.user.loggedIn) return;
  if (!result?.ok) { state.remoteDeliveryStatus = 'error'; state.remoteDeliveryError = result?.error?.message || '配送选项暂时无法读取'; }
  else { state.remoteDeliveryOptions = { warehouses: result.data?.warehouses || [], areas: result.data?.areas || [], slots: result.data?.slots || [], pickupSites: result.data?.pickupSites || [] }; state.remoteDeliveryStatus = 'ready'; state.remoteDeliveryError = ''; normalizeRemoteSelections(); }
  invalidateRemoteQuote(); if (state.utilityKind === 'checkout') renderUtility('checkout');
}
async function loadRemoteCommerce() {
  if (!isRemoteCommerce() || !state.user.loggedIn) return;
  await Promise.all([loadRemoteCart(), loadRemoteAddresses(), loadRemoteDeliveryOptions()]);
}
async function loadCheckoutCoupons() {
  if (!isRemoteCommerce() || !state.user.loggedIn) return;
  state.remoteCouponStatus = 'loading'; state.remoteCouponError = '';
  const result = await window.MengshixianCollection.fetchRemotePages(params => window.MengshixianApi.coupons.list(params), { pageSize: 100, maxPages: REMOTE_MAX_PAGES });
  if (!state.user.loggedIn) return;
  if (!result?.ok) { state.remoteCouponStatus = 'error'; state.remoteCouponError = result?.error?.message || '优惠券读取失败'; }
  else { state.coupons = result.rows; state.remoteCouponStatus = 'ready'; state.remoteCouponError = ''; if (state.remoteCouponId && !state.coupons.some(item => item._id === state.remoteCouponId && item.status === 'available')) { state.remoteCouponId = ''; invalidateRemoteQuote(); } }
  if (state.utilityKind === 'checkout') renderUtility('checkout');
}

function remoteCheckoutItems() { return state.remoteCartRows.filter(item => item.selected !== false && !item.unavailable && Number(item.quantity) > 0).map(item => ({ skuId: item.skuId, quantity: Number(item.quantity) })); }
function buildRemoteCheckoutPayload() {
  normalizeRemoteSelections();
  const payload = { items: remoteCheckoutItems(), channel: 'web', fulfillmentType: state.remoteFulfillmentType, warehouseId: state.remoteWarehouseId };
  if (state.remoteFulfillmentType === 'delivery') { payload.addressId = state.remoteCheckoutAddress?._id || ''; if (state.remoteDeliverySlotId) payload.deliverySlotId = state.remoteDeliverySlotId; }
  else payload.pickupSiteId = state.remotePickupSiteId;
  if (state.remoteAcceptedQuoteToken) payload.acceptedQuoteToken = state.remoteAcceptedQuoteToken;
  if (state.remoteCouponId) payload.couponId = state.remoteCouponId;
  return payload;
}
async function refreshRemoteCheckoutQuote() {
  if (!isRemoteCommerce() || !state.user.loggedIn) return;
  const payload = buildRemoteCheckoutPayload();
  if (!payload.items.length) { state.remoteCheckoutStatus = 'error'; state.remoteCheckoutError = '购物车没有可结算商品'; return renderUtility('checkout'); }
  if (!payload.warehouseId || (payload.fulfillmentType === 'delivery' && !payload.addressId) || (payload.fulfillmentType === 'pickup' && !payload.pickupSiteId)) { state.remoteCheckoutStatus = 'error'; state.remoteCheckoutError = payload.fulfillmentType === 'delivery' ? '请选择有效收货地址和配送仓库' : '请选择有效自提点'; return renderUtility('checkout'); }
  state.remoteCheckoutStatus = 'loading'; state.remoteCheckoutError = ''; state.remoteCheckoutQuote = null; renderUtility('checkout');
  const result = await window.MengshixianApi.checkout.quote(payload);
  if (!state.user.loggedIn) return;
  if (!result?.ok || !result.data?.quote) { state.remoteCheckoutStatus = 'error'; state.remoteCheckoutError = result?.error?.message || '结算报价失败，请重试'; state.remoteCheckoutPayload = null; }
  else { state.remoteCheckoutStatus = 'ready'; state.remoteCheckoutQuote = result.data.quote; state.remoteCheckoutPayload = payload; state.remoteOrderIdempotencyKey = ''; }
  if (state.utilityKind === 'checkout') renderUtility('checkout');
}

function selectWarehouse(name) {
  const options = { '赣州仓': { warehouse: '赣州仓', eta: '今天 18:30 前' }, '南康仓': { warehouse: '南康仓', eta: '今天 19:30 前' } };
  state.delivery = { ...state.delivery, ...(options[name] || options['赣州仓']) };
  refreshDeliveryLabels();
  showToast(`已切换至${name}`);
  switchTab('home');
}

function showAddressForm(addressId = '') {
  if (isRemoteCommerce()) {
    const address = state.remoteAddresses.find(item => item._id === addressId) || {};
    const regionCodes = [...new Set(state.remoteDeliveryOptions.areas.flatMap(area => area.regionCodes || []).filter(Boolean))];
    state.remoteAddressEditingId = address._id || '';
    document.querySelector('#utilityView').innerHTML = utilityHead('address', address._id ? '编辑配送地址' : '新增配送地址') + `<form class="address-form" id="addressForm"><label>收货人<input name="name" maxlength="40" required value="${escapeText(address.name || '')}"></label><label>手机号码<input name="phone" required inputmode="numeric" pattern="1[3-9]\\d{9}" placeholder="${address.phoneMasked ? `当前 ${escapeText(address.phoneMasked)}，请重新输入完整号码` : '11 位手机号码'}"></label><label>配送区域<input name="regionCode" list="deliveryRegionCodes" maxlength="80" required value="${escapeText(address.regionCode || '')}" placeholder="请选择配送区域；找不到时可输入运营提供的编码"><datalist id="deliveryRegionCodes">${regionCodes.map(code => `<option value="${escapeText(code)}"></option>`).join('')}</datalist></label><small class="form-note">可配送区域来自当前运营配置，最终范围以结算报价为准。</small><label>详细地址<textarea name="detail" maxlength="200" required>${escapeText(address.detail || '')}</textarea></label><label>地址标签<input name="tag" maxlength="20" value="${escapeText(address.tag || '')}" placeholder="如：家、公司"></label><label><input name="isDefault" type="checkbox" ${address.isDefault || !state.remoteAddresses.length ? 'checked' : ''}> 设为默认地址</label><button type="submit">${address._id ? '保存修改' : '新增地址'}</button></form>`;
    return;
  }
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
    <section class="wechat-login"><div class="wechat-mark">鲜</div><h2>网页登录</h2><p>请输入运营人员为您开通的网页账号。企业或个人身份由服务端用户资料决定。</p><form id="webLoginForm"><label>登录账号<input name="loginId" autocomplete="username" maxlength="80" required></label><label>登录密码<input name="password" type="password" autocomplete="current-password" minlength="10" maxlength="128" required></label><label><input id="loginAgree" type="checkbox"> 我已阅读并同意《服务协议》和《隐私政策》</label><button class="role-btn" type="submit" ${state.remoteIdentityStatus === 'loading' ? 'disabled' : ''}>${state.remoteIdentityStatus === 'loading' ? '正在登录…' : '登录'}</button></form>${state.remoteIdentityError ? `<small role="alert">${escapeText(state.remoteIdentityError)}</small>` : '<small>会话仅保存在当前浏览器标签页，关闭标签页后需要重新登录。</small>'}</section>`;
  const sheet = document.querySelector('#loginSheet');
  sheet.classList.add('is-visible');
  sheet.setAttribute('aria-hidden', 'false');
}

function closeLogin() {
  const sheet = document.querySelector('#loginSheet');
  sheet.classList.remove('is-visible');
  sheet.setAttribute('aria-hidden', 'true');
}

async function loginWithCredentials(loginId, password) {
  const agreed = document.querySelector('#loginAgree');
  if (agreed && !agreed.checked) {
    showToast('请先阅读并同意服务协议与隐私政策');
    return;
  }
  if (window.MengshixianApi?.config.provider !== 'cloudbase') { state.remoteIdentityStatus = 'error'; state.remoteIdentityError = '网页认证服务尚未配置'; openLogin(); return showToast(state.remoteIdentityError); }
  state.remoteIdentityStatus = 'loading'; state.remoteIdentityError = ''; openLogin();
  const login = await window.MengshixianApi.auth.login({ loginId, password });
  if (!login?.ok || !login.data?.sessionToken || !login.data?.user) { state.remoteIdentityStatus = 'error'; state.remoteIdentityError = login?.error?.message || '登录失败，请重试'; state.user.loggedIn = false; openLogin(); return; }
  window.MengshixianApi.setSessionToken(login.data.sessionToken);
  state.remoteUser = login.data.user; state.role = login.data.user.userType === 'b' && login.data.user.businessStatus === 'approved' ? 'B' : 'C'; state.remoteIdentityStatus = 'ready';
  state.user.loggedIn = true;
  closeLogin();
  refreshAllPrices();
  await Promise.all([loadRemoteCatalogPrices(products.flatMap(product => (product.skuOptions || []).map(sku => sku.id))), loadRemoteCommerce()]);
  if (state.pendingCheckout) {
    state.pendingCheckout = false;
    openUtility('checkout');
    return showToast(`登录成功，以${roleName()}身份结算`);
  }
  switchTab('mine');
  showToast(`登录成功 · ${roleName()}身份`);
}
async function restoreWebSession() {
  const api = window.MengshixianApi;
  if (api?.config.provider !== 'cloudbase' || typeof api.getSessionToken !== 'function' || !api.getSessionToken()) return;
  state.remoteIdentityStatus = 'loading'; renderMine();
  const identity = await api.auth.getMe();
  if (!identity?.ok || !identity.data?.user) { api.clearSession(); state.remoteIdentityStatus = 'error'; state.remoteIdentityError = identity?.error?.message || '会话已失效'; state.user.loggedIn = false; renderMine(); return; }
  state.remoteUser = identity.data.user; state.role = identity.data.user.userType === 'b' && identity.data.user.businessStatus === 'approved' ? 'B' : 'C'; state.user.loggedIn = true; state.remoteIdentityStatus = 'ready';
  renderMine(); refreshAllPrices(); await Promise.all([loadRemoteCatalogPrices(products.flatMap(product => (product.skuOptions || []).map(sku => sku.id))), loadRemoteCommerce()]);
}
function clearWebIdentity(message = '') {
  if (typeof window.MengshixianApi?.clearSession === 'function') window.MengshixianApi.clearSession();
  state.user.loggedIn = false; state.remoteUser = null; state.role = 'C'; state.remoteIdentityStatus = message ? 'error' : 'idle'; state.remoteIdentityError = message;
  state.remotePrices = {}; state.remotePriceStatus = 'idle'; state.remoteOrders = []; state.remoteRefunds = []; state.remoteOrderDetail = null; state.remoteRefundDetail = null; state.businessFrequent = []; state.procurementAccount = null; state.receivables = []; state.statements = []; state.inquiries = []; state.inquiryDetail = null; state.bundles = []; state.bundleQuote = null; state.groupCampaigns = []; state.myGroups = []; state.couponTemplates = []; state.coupons = []; state.favorites = []; state.pointsAccount = null; state.pointsLedger = []; state.membershipProfile = null; state.membershipLevel = null; state.reviewEligible = []; state.myReviews = []; state.invoiceTitles = []; state.invoices = []; state.storedValueAccount = null; state.storedValueLedger = []; state.consumerStatus = {}; state.consumerError = {};
  state.remoteCartRows = []; state.remoteCartStatus = 'idle'; state.remoteCartError = ''; state.remoteCartBusy = {}; state.remoteAddresses = []; state.remoteAddressStatus = 'idle'; state.remoteAddressError = ''; state.remoteDeliveryOptions = { warehouses: [], areas: [], slots: [], pickupSites: [] }; state.remoteDeliveryStatus = 'idle'; state.remoteDeliveryError = ''; state.remoteCheckoutAddress = null; state.remoteAcceptedQuoteToken = ''; state.remoteCouponId = ''; state.remoteCouponStatus = 'idle'; state.remoteCouponError = ''; state.inquiryAcceptKeys = {}; invalidateRemoteQuote();
  refreshAllPrices(); renderMine();
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
        const image = webMediaUrl(media.url, fallbackImages[index % fallbackImages.length]);
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
  state.remoteCatalogStatus = 'loading';
  state.remoteCatalogError = '';
  renderDealList();
  renderCategory();
  const result = await window.MengshixianCollection.fetchRemotePages(params => api.catalog.listProducts(params), { pageSize: REMOTE_PAGE_SIZE, maxPages: REMOTE_MAX_PAGES });
  if (!result.ok) {
    state.remoteCatalogStatus = 'error';
    state.remoteCatalogError = '商品目录暂时无法读取';
    renderDealList();
    renderCategory();
    showToast('商品加载失败，请重试');
    return;
  }
  const rows = result.rows;
  const mediaMap = await resolveRemoteMedia(rows.map(item => item.coverMediaId));
  products = rows.map((item) => {
    const skuOptions = Array.isArray(item.skus) ? item.skus.map(normalizeRemoteSku) : [];
    const image = mediaMap.get(item.coverMediaId);
    return normalizeRemoteProduct(item, skuOptions, image && image.url);
  });
  state.remoteCatalogStatus = 'ready';
  Object.keys(groupDeals).forEach((id) => delete groupDeals[id]);
  state.cart = {};
  state.frequent = products.slice(0, 4).map((product) => product.id);
  renderDealList();
  renderGroupList();
  renderCategory();
  renderFrequent();
  renderCart();
  updateCartCount();
  if (state.user.loggedIn) loadRemoteCatalogPrices(products.flatMap(product => (product.skuOptions || []).map(sku => sku.id)));
}

async function loadRemoteCategories() {
  const api = window.MengshixianApi;
  if (!api || !api.config || api.config.provider !== 'cloudbase') return;
  state.remoteCategoryStatus = 'loading';
  state.remoteCategoryError = '';
  const result = await window.MengshixianCollection.fetchRemotePages(params => api.catalog.listCategories(params));
  if (!result.ok) {
    state.remoteCategoryStatus = 'error';
    state.remoteCategoryError = '商品分类暂时无法读取';
    renderCategory();
    showToast('分类加载失败，请重试');
    return;
  }
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
  state.remoteCategoryStatus = 'ready';
  renderCategory();
}

function normalizeRemoteSku(sku) {
  return {
    id: sku._id,
    label: sku.specName || sku.packageUnit || sku.netWeight || '默认规格',
    specName: sku.specName || '',
    packageUnit: sku.packageUnit || '',
    netWeight: sku.netWeight || '',
    weightUnit: sku.weightUnit || '',
    piecesPerCase: sku.piecesPerCase || 0,
    barcode: sku.barcode || '',
    mediaIds: Array.isArray(sku.mediaIds) ? sku.mediaIds : [],
    minOrderQuantity: positiveInteger(sku.minOrderQuantity, 1),
    orderMultiple: positiveInteger(sku.orderMultiple, 1)
  };
}

function normalizeRemoteProduct(item, skuOptions, coverUrl) {
  return {
    id: item._id,
    name: item.name || '未命名商品',
    subtitle: item.subtitle || '',
    category: item.categoryName || '其他冻品',
    categoryId: item.categoryId || '',
    brand: item.brand || '',
    origin: item.origin || '',
    storageType: item.storageType || '',
    frozenTemperature: item.frozenTemperature || '',
    shelfLifeDays: item.shelfLifeDays || 0,
    unit: skuOptions[0] && skuOptions[0].packageUnit ? skuOptions[0].packageUnit : '规格待补充',
    packageUnit: skuOptions[0] ? skuOptions[0].packageUnit : '',
    specLabel: skuOptions[0] ? skuOptions[0].label : '',
    skuOptions,
    specs: skuOptions.map((sku) => sku.label),
    sales: 0,
    tag: '冷链商品',
    img: coverUrl || 'placeholder.svg',
    detailImages: [],
    video: '',
    videoPoster: ''
  };
}

async function loadRemoteProductDetail(productId) {
  const api = window.MengshixianApi;
  if (!api || api.config.provider !== 'cloudbase') return;
  const requestId = state.detailRequestId + 1;
  state.detailRequestId = requestId;
  state.detailStatus = 'loading';
  state.detailError = '';
  renderProductDetail();
  const response = await api.catalog.getProduct(productId);
  if (requestId !== state.detailRequestId || String(state.detailProductId) !== String(productId)) return;
  if (!response || !response.ok || !response.data || !response.data.product) {
    state.detailStatus = 'error';
    state.detailError = response && response.error && response.error.message ? response.error.message : '商品详情暂时无法读取';
    renderProductDetail();
    return;
  }
  const detail = response.data;
  const skuOptions = Array.isArray(detail.skus) ? detail.skus.map(normalizeRemoteSku) : [];
  const associations = Array.isArray(detail.media) ? detail.media : [];
  const mediaIds = [detail.product.coverMediaId, ...associations.map((item) => item.mediaAssetId), ...skuOptions.flatMap((sku) => sku.mediaIds)].filter(Boolean);
  const mediaMap = await resolveRemoteMedia(mediaIds);
  if (requestId !== state.detailRequestId || String(state.detailProductId) !== String(productId)) return;
  const current = byId(productId) || {};
  const coverAssociation = associations.find((item) => item.mediaType === 'image' && item.role === 'cover');
  const detailImages = associations
    .filter((item) => item.mediaType === 'image' && ['detail', 'instruction'].includes(item.role))
    .map((item) => mediaMap.get(item.mediaAssetId)?.url)
    .filter(Boolean);
  const videoAssociation = associations.find((item) => item.mediaType === 'video');
  const posterAssociation = associations.find((item) => item.mediaType === 'image' && item.role === 'video_cover');
  const coverUrl = mediaMap.get(coverAssociation && coverAssociation.mediaAssetId || detail.product.coverMediaId)?.url || current.img;
  const merged = {
    ...current,
    ...normalizeRemoteProduct(detail.product, skuOptions, coverUrl),
    detailImages,
    video: mediaMap.get(videoAssociation && videoAssociation.mediaAssetId)?.url || '',
    videoPoster: mediaMap.get(posterAssociation && posterAssociation.mediaAssetId)?.url || ''
  };
  const index = products.findIndex((item) => String(item.id) === String(productId));
  if (index >= 0) products[index] = merged;
  if (!state.selectedSpecs[productId] || !productVariantsFor(merged).includes(state.selectedSpecs[productId])) {
    state.selectedSpecs[productId] = productVariantsFor(merged)[0];
  }
  const requestedQuantity = state.detailQty;
  state.detailQty = normalizePurchaseQuantity(requestedQuantity, purchaseRuleFor(merged));
  state.detailStatus = 'ready';
  renderProductDetail();
  if (state.user.loggedIn) await loadRemoteCatalogPrices(skuOptions.map(sku => sku.id));
}

async function loadRemoteCatalogPrices(skuIds) {
  const api = window.MengshixianApi;
  if (!api || api.config.provider !== 'cloudbase' || !state.user.loggedIn || typeof api.catalog.listPrices !== 'function') return false;
  const ids = window.MengshixianCollection.chunkUnique(skuIds, 100).flat();
  if (!ids.length) return true;
  state.remotePriceStatus = 'loading';
  const nextPrices = { ...state.remotePrices };
  for (const batch of window.MengshixianCollection.chunkUnique(ids, 100)) {
    const response = await api.catalog.listPrices(batch);
    if (!response?.ok || !Array.isArray(response.data?.rows)) {
      state.remotePriceStatus = 'error';
      ids.forEach(id => delete nextPrices[String(id)]);
      state.remotePrices = nextPrices;
      refreshAllPrices();
      return false;
    }
    response.data.rows.forEach(row => {
      if (!row || !row.skuId || !Number.isFinite(Number(row.amountCent))) return;
      nextPrices[String(row.skuId)] = {
        ...row,
        amountCent: Number(row.amountCent),
        quantityTiers: Array.isArray(row.quantityTiers) ? row.quantityTiers
          .filter(tier => Number.isInteger(Number(tier.minQuantity)) && Number.isFinite(Number(tier.amountCent)))
          .map(tier => ({ minQuantity: Number(tier.minQuantity), maxQuantity: tier.maxQuantity === null || tier.maxQuantity === undefined ? null : Number(tier.maxQuantity), amountCent: Number(tier.amountCent) })) : []
      };
    });
  }
  state.remotePrices = nextPrices;
  state.remotePriceStatus = 'ready';
  const detailProduct = byId(state.detailProductId);
  if (detailProduct) state.detailQty = normalizePurchaseQuantity(state.detailQty, purchaseRuleFor(detailProduct));
  refreshAllPrices();
  return true;
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
  state.remoteCatalogStatus = 'idle';
  state.remoteCategoryStatus = 'idle';
  state.remoteCatalogError = '';
  state.remoteCategoryError = '';
  state.remotePrices = {};
  state.remotePriceStatus = 'idle';
  Object.keys(groupDeals).forEach(id => delete groupDeals[id]);
}

async function submitRemoteOrder() {
  if (state.remoteOrderSubmitting) return false;
  const payload = buildRemoteCheckoutPayload();
  if (state.remoteCheckoutStatus !== 'ready' || !state.remoteCheckoutQuote || JSON.stringify(payload) !== JSON.stringify(state.remoteCheckoutPayload)) { invalidateRemoteQuote(); renderUtility('checkout'); showToast('结算信息已变化，请重新获取报价'); await refreshRemoteCheckoutQuote(); return false; }
  if (!state.remoteOrderIdempotencyKey) state.remoteOrderIdempotencyKey = `web-order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  state.remoteOrderSubmitting = true; renderUtility('checkout');
  const result = await window.MengshixianApi.checkout.createOrder({ ...payload, paymentMethod: state.remotePaymentMethod, idempotencyKey: state.remoteOrderIdempotencyKey });
  state.remoteOrderSubmitting = false;
  if (!result?.ok || !result.data?.order) { const message = result?.error?.message || '订单提交失败，可安全重试'; const code = result?.error?.code || ''; if (/(_CHANGED|NOT_AVAILABLE|NOT_MET|OUT_OF_DELIVERY_RANGE|ADDRESS_NOT_AVAILABLE|DELIVERY_SLOT_NOT_AVAILABLE|PICKUP_SITE_)/.test(code)) { invalidateRemoteQuote(); state.remoteCheckoutStatus = 'error'; } state.remoteCheckoutError = message; renderUtility('checkout'); showToast(message); return false; }
  const created = result.data.order; const submittedSkuIds = new Set(payload.items.map(item => String(item.skuId))); const rows = state.remoteCartRows.filter(row => row.selected !== false && !row.unavailable && submittedSkuIds.has(String(row.skuId)));
  state.remoteCartRows = state.remoteCartRows.filter(row => !rows.includes(row)); state.remoteOrderIdempotencyKey = ''; state.remoteCouponId = ''; invalidateRemoteQuote(true); updateCartCount(); renderCart(); loadCheckoutCoupons();
  Promise.all(rows.map(row => window.MengshixianApi.cart.removeItem(row._id))).then(results => { if (results.some(item => !item?.ok)) { showToast('订单已创建，购物车清理未完成，正在重新同步'); loadRemoteCart(); } });
  state.utilityStack = []; state.utilityReturnPage = 'home'; await loadRemoteOrders(); openUtility('orders', '全部订单', true); showToast(result.data.idempotent ? `订单 ${created.orderNo || ''} 已存在` : `订单 ${created.orderNo || ''} 已创建`); return true;
}
async function acceptRemoteInquiryQuote(input) {
  if (!isVerifiedBusiness() || state.businessBusy) return false;
  const acceptKey = `${input.inquiryId}:${input.quoteId}:${input.version}`;
  if (!state.inquiryAcceptKeys[acceptKey]) state.inquiryAcceptKeys[acceptKey] = `web-inquiry-accept-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  state.businessBusy = true;
  const result = await window.MengshixianApi.inquiries.accept({ id: input.inquiryId, quoteId: input.quoteId, version: Number(input.version), addToCart: true, idempotencyKey: state.inquiryAcceptKeys[acceptKey] });
  state.businessBusy = false;
  if (!result?.ok) { showToast(result?.error?.message || '报价已失效，请刷新后重试'); return false; }
  delete state.inquiryAcceptKeys[acceptKey]; await applyAddedItems(result.data?.addedItems); state.remoteAcceptedQuoteToken = result.data?.acceptedQuoteToken || ''; showToast((result.data?.invalidItems || []).length ? `已加入可购商品，${result.data.invalidItems.length} 项失效` : '报价商品已加入购物车');
  if (input.destination === 'checkout') openUtility('checkout'); else switchTab('cart'); return true;
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
    const protectedPage = ['orders', 'bundles', 'coupon', 'address', 'account', 'favorites', 'trace', 'aftersale', 'invoice', 'invoiceHead', 'invoiceRecords', 'points', 'review', 'storedValue', 'coldchain', 'group', 'procurement', 'inquiries'].includes(utility.dataset.utility);
    if (protectedPage && !state.user.loggedIn) return openLogin();
    return openUtility(utility.dataset.utility, utility.dataset.orderFilter);
  }

  const filter = target.closest('[data-order-filter]');
  if (filter) return openUtility('orders', filter.dataset.orderFilter);

  const orderDetail = target.closest('[data-order-detail]');
  if (orderDetail) return openRemoteOrderDetail(orderDetail.dataset.orderDetail);

  const aftersaleOrder = target.closest('[data-aftersale-order]');
  if (aftersaleOrder) return prepareAftersale(aftersaleOrder.dataset.aftersaleOrder, aftersaleOrder.dataset.aftersaleItemIndex);
  const refundDetail = target.closest('[data-refund-detail]');
  if (refundDetail) return openRemoteRefundDetail(refundDetail.dataset.refundDetail);
  const repurchase = target.closest('[data-repurchase-order]');
  if (repurchase) return openRepurchase(repurchase.dataset.repurchaseOrder);
  const inquiryDetail = target.closest('[data-inquiry-detail]');
  if (inquiryDetail) return openInquiryDetail(inquiryDetail.dataset.inquiryDetail);
  const removeFrequent = target.closest('[data-remove-frequent]');
  if (removeFrequent) {
    if (!isVerifiedBusiness()) return showToast('无权修改企业常购');
    return window.MengshixianApi.frequent.remove(removeFrequent.dataset.removeFrequent).then(result => result?.ok ? loadBusinessFrequent() : showToast(result?.error?.message || '移除失败'));
  }
  const acceptQuote = target.closest('[data-accept-quote]');
  if (acceptQuote) {
    return acceptRemoteInquiryQuote({ inquiryId: acceptQuote.dataset.inquiryId, quoteId: acceptQuote.dataset.acceptQuote, version: acceptQuote.dataset.version, destination: acceptQuote.dataset.acceptDestination });
  }

  const bundleQuote = target.closest('[data-bundle-quote]');
  if (bundleQuote) return (async () => { if (state.remoteAddressStatus !== 'ready' || state.remoteDeliveryStatus !== 'ready') await loadRemoteCommerce(); normalizeRemoteSelections(); const address = selectedRemoteAddress(); const payload = { bundleId: bundleQuote.dataset.bundleQuote, quantity: 1, channel: 'web', fulfillmentType: state.remoteFulfillmentType, warehouseId: state.remoteWarehouseId, ...(state.remoteFulfillmentType === 'pickup' ? { pickupSiteId: state.remotePickupSiteId } : { regionCode: address?.regionCode || '' }) }; if (!payload.warehouseId || (payload.fulfillmentType === 'delivery' && !payload.regionCode) || (payload.fulfillmentType === 'pickup' && !payload.pickupSiteId)) return showToast('请先完善配送或自提信息'); const result = await window.MengshixianApi.bundles.quote(payload); if (!result?.ok) return showToast(result?.error?.message || '套餐报价失败'); state.bundleQuote = result.data?.quote || null; renderUtility('bundles'); showToast(`套餐优惠 ${centsMoney(state.bundleQuote?.bundleDiscountCent)}`); })();
  const claimCoupon = target.closest('[data-claim-coupon]');
  if (claimCoupon && !state.consumerBusy) { state.consumerBusy = true; return window.MengshixianApi.coupons.claim({ templateId: claimCoupon.dataset.claimCoupon, idempotencyKey: `web-coupon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }).then(async result => { state.consumerBusy = false; if (!result?.ok) return showToast(result?.error?.message || '领券失败'); await loadConsumerUtility('coupon'); showToast(result.data?.idempotent ? '该优惠券已经领取' : '领取成功'); }); }
  const removeFavorite = target.closest('[data-remove-favorite]');
  if (removeFavorite) return window.MengshixianApi.favorites.remove(removeFavorite.dataset.removeFavorite).then(async result => { if (!result?.ok) return showToast(result?.error?.message || '移除失败'); await loadConsumerUtility('favorites'); showToast('已移除收藏'); });
  const createGroup = target.closest('[data-create-group]');
  if (createGroup) return window.MengshixianApi.groups.create({ campaignId: createGroup.dataset.createGroup }).then(async result => { if (!result?.ok) return showToast(result?.error?.message || '发起拼团失败'); await loadConsumerUtility('group'); showToast('拼团已发起，支付与成团仍以服务端状态为准'); });
  const deleteInvoiceTitle = target.closest('[data-delete-invoice-title]');
  if (deleteInvoiceTitle) { if (!window.confirm('确认删除这个发票抬头？历史发票不会受影响。')) return; return window.MengshixianApi.invoiceTitles.remove(deleteInvoiceTitle.dataset.deleteInvoiceTitle).then(async result => { if (!result?.ok) return showToast(result?.error?.message || '删除失败'); await loadConsumerUtility('invoice'); showToast('发票抬头已删除'); }); }

  const editAddress = target.closest('[data-edit-address]');
  if (editAddress) return showAddressForm(editAddress.dataset.editAddress);
  const defaultAddress = target.closest('[data-default-address]');
  if (defaultAddress) return window.MengshixianApi.address.setDefault(defaultAddress.dataset.defaultAddress).then(async result => { if (!result?.ok) return showToast(result?.error?.message || '默认地址设置失败'); await loadRemoteAddresses(); showToast('默认地址已更新'); });
  const deleteAddress = target.closest('[data-delete-address]');
  if (deleteAddress) { if (!window.confirm('确认删除这个收货地址？删除后无法撤销。')) return; return window.MengshixianApi.address.remove(deleteAddress.dataset.deleteAddress).then(async result => { if (!result?.ok) return showToast(result?.error?.message || '地址删除失败'); await loadRemoteAddresses(); showToast('收货地址已删除'); }); }
  const fulfillment = target.closest('[data-fulfillment]');
  if (fulfillment) { state.remoteFulfillmentType = fulfillment.dataset.fulfillment; normalizeRemoteSelections(); invalidateRemoteQuote(); renderUtility('checkout'); return refreshRemoteCheckoutQuote(); }

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
    if (isRemoteCommerce()) {
      const row = state.remoteCartRows.find(item => String(item.skuId) === String(quantity.dataset.skuId)) || state.remoteCartRows.find(item => String(item._id) === String(quantity.dataset.cartItemId));
      if (!row) return;
      const product = productForSku(row.skuId); const direction = Number(quantity.dataset.delta) < 0 ? 'down' : 'up';
      if (!product || row.unavailable) return direction === 'down' ? removeRemoteCartRow(row._id) : showToast('该商品已不可购买');
      const sku = skuForId(product, row.skuId); const pricedProduct = { ...product, skuOptions: sku ? [sku] : product.skuOptions };
      const rule = purchaseRuleFor(pricedProduct); const requested = Number(row.quantity) + (direction === 'down' ? -rule.orderMultiple : rule.orderMultiple); const corrected = normalizePurchaseQuantity(requested, rule, direction);
      return corrected > 0 ? setRemoteCartQuantity(pricedProduct, corrected, direction) : removeRemoteCartRow(row._id);
    }
    const id = quantity.dataset.qty;
    const product = byId(id);
    if (!product) return;
    const rule = purchaseRuleFor(product);
    const direction = Number(quantity.dataset.delta) < 0 ? 'down' : 'up';
    const requested = (state.cart[id] || 0) + (direction === 'down' ? -rule.orderMultiple : rule.orderMultiple);
    state.cart[id] = normalizePurchaseQuantity(requested, rule, direction);
    updateCartCount();
    return renderCart();
  }

  const detailQty = target.closest('[data-detail-qty]');
  if (detailQty) {
    const product = byId(state.detailProductId);
    if (!product) return;
    const rule = purchaseRuleFor(product);
    const direction = Number(detailQty.dataset.detailQty) < 0 ? 'down' : 'up';
    const requested = state.detailQty + (direction === 'down' ? -rule.orderMultiple : rule.orderMultiple);
    const corrected = normalizePurchaseQuantity(requested, rule, direction);
    if (corrected > 0) state.detailQty = corrected;
    return renderProductDetail();
  }

  const spec = target.closest('[data-spec]');
  if (spec) {
    state.selectedSpecs[spec.dataset.spec] = spec.dataset.specValue;
    const product = byId(spec.dataset.spec);
    if (product) {
      const requested = state.detailQty;
      state.detailQty = normalizePurchaseQuantity(requested, purchaseRuleFor(product));
      if (state.detailQty !== requested) showToast(`已按所选规格调整为 ${state.detailQty} 件`);
    }
    if (document.querySelector('[data-page="detail"]').classList.contains('is-active')) return renderProductDetail();
    return openProduct(spec.dataset.spec);
  }

  const action = target.closest('[data-action]')?.dataset.action;
  if (action === 'close-sheet' || action === 'detail-back') return closeProduct();
  if (action === 'utility-back') return returnFromUtility();
  if (action === 'close-login') return closeLogin();
  if (action === 'retry-catalog') return loadRemoteCatalog();
  if (action === 'retry-categories') return loadRemoteCategories();
  if (action === 'retry-detail') return loadRemoteProductDetail(state.detailProductId);
  if (action === 'retry-orders') return loadRemoteOrders();
  if (action === 'retry-order-detail') return openRemoteOrderDetail(state.remoteOrderDetailId);
  if (action === 'retry-refunds') return loadRemoteAftersaleData();
  if (action === 'retry-refund-detail') return openRemoteRefundDetail(state.remoteRefundDetailId);
  if (action === 'retry-aftersale-order') return prepareAftersale(state.aftersaleOrderId, state.aftersaleItemIndex);
  if (action === 'retry-business-frequent') return loadBusinessFrequent();
  if (action === 'retry-procurement') return loadProcurement();
  if (action === 'retry-inquiries') return loadInquiries();
  if (action === 'retry-inquiry-detail') return openInquiryDetail(state.inquiryDetailId);
  if (action && action.startsWith('retry-consumer-')) return loadConsumerUtility(action.replace('retry-consumer-', ''));
  if (action === 'retry-cart') return loadRemoteCart();
  if (action === 'retry-addresses') return loadRemoteAddresses();
  if (action === 'retry-commerce') return loadRemoteCommerce().then(refreshRemoteCheckoutQuote);
  if (action === 'retry-checkout-quote') return refreshRemoteCheckoutQuote();
  if (action === 'retry-checkout-coupons') return loadCheckoutCoupons().then(refreshRemoteCheckoutQuote);
  if (action === 'clear-aftersale-files') { state.aftersaleFiles = []; return renderUtility('aftersaleApply'); }
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
    if (isRemoteCommerce()) {
      const rows = state.remoteCartRows.slice(); state.remoteCartRows = []; invalidateRemoteQuote(true); updateCartCount(); renderCart();
      return Promise.all(rows.map(row => window.MengshixianApi.cart.removeItem(row._id))).then(results => { if (results.some(result => !result?.ok)) { showToast('部分商品移除失败，已重新同步购物车'); return loadRemoteCart(); } showToast('购物车已清空'); });
    }
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
  if (action === 'save-business-frequent') {
    if (!isVerifiedBusiness() || state.businessBusy) return showToast('仅已认证企业采购账号可以维护常购');
    const product = byId(state.detailProductId); const sku = selectedSku(product); if (!sku) return showToast('当前规格不可用');
    state.businessBusy = true;
    return window.MengshixianApi.frequent.save({ skuId: sku.id, quantity: state.detailQty, channel: 'web' }).then(result => { state.businessBusy = false; if (!result?.ok) return showToast(result?.error?.message || '加入常购失败'); showToast('已加入企业常购'); });
  }
  if (action === 'save-favorite') {
    if (!state.user.loggedIn || state.consumerBusy) return showToast('请先登录');
    const product = byId(state.detailProductId); const sku = selectedSku(product); if (!sku) return showToast('当前规格不可收藏');
    state.consumerBusy = true;
    return window.MengshixianApi.favorites.save({ skuId: sku.id, quantity: state.detailQty, channel: 'web' }).then(result => { state.consumerBusy = false; showToast(result?.ok ? '已加入收藏' : (result?.error?.message || '收藏失败')); });
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
    if (isRemoteCommerce()) return submitRemoteOrder();
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
  if (action === 'batch-add-frequent') {
    if (!isVerifiedBusiness() || state.businessBusy) return;
    state.businessBusy = true; renderFrequent();
    return window.MengshixianApi.frequent.batchAddToCart({ ids: state.businessFrequent.map(item => item._id), idempotencyKey: `web-frequent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, channel: 'web' }).then(result => {
      state.businessBusy = false; renderFrequent();
      if (!result?.ok) return showToast(result?.error?.message || '批量加购失败');
      applyAddedItems(result.data?.addedItems); const invalidCount = (result.data?.invalidItems || []).length;
      return showToast(invalidCount ? `已加入可购商品，${invalidCount} 项已失效` : '常购商品已全部加入');
    });
  }
  if (action === 'batch-add-favorites') {
    if (!state.user.loggedIn || state.consumerBusy) return;
    state.consumerBusy = true;
    return window.MengshixianApi.favorites.batchAddToCart({ ids: state.favorites.map(item => item._id), idempotencyKey: `web-favorites-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, channel: 'web' }).then(result => { state.consumerBusy = false; if (!result?.ok) return showToast(result?.error?.message || '批量加购失败'); applyAddedItems(result.data?.addedItems); const invalidCount = (result.data?.invalidItems || []).length; switchTab('cart'); showToast(invalidCount ? `已加入可购收藏，${invalidCount} 项失效` : '收藏商品已加入购物车'); });
  }
  if (action === 'commit-repurchase') {
    if (!isVerifiedBusiness() || state.businessBusy) return;
    state.businessBusy = true; renderUtility('repurchase');
    return window.MengshixianApi.repurchase.commit({ orderId: state.repurchaseOrderId }).then(result => {
      state.businessBusy = false;
      if (!result?.ok) { renderUtility('repurchase'); return showToast(result?.error?.message || '复购失败'); }
      applyAddedItems(result.data?.addedItems); const invalidCount = (result.data?.invalidItems || []).length;
      switchTab('cart'); return showToast(invalidCount ? `已加入可购商品，${invalidCount} 项失效` : '复购商品已加入购物车');
    });
  }
  if (action === 'add-frequent') {
    state.frequent.forEach(id => {
      const product = byId(id);
      if (!product) return;
      state.cart[id] = normalizePurchaseQuantity((state.cart[id] || 0) + 1, purchaseRuleFor(product));
    });
    updateCartCount();
    renderCart();
    return showToast('常用商品已全部加入');
  }
  if (action === 'new-address') return showAddressForm();
  if (action === 'open-login') return openLogin();
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
    return window.MengshixianApi.auth.logout().finally(() => { clearWebIdentity(); switchTab('mine'); showToast('已退出登录'); });
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
  if (action === 'remote-daily-checkin') {
    if (state.consumerBusy) return;
    state.consumerBusy = true;
    return window.MengshixianApi.points.signIn({ idempotencyKey: `web-signin-${new Date().toISOString().slice(0, 10)}` }).then(async result => { state.consumerBusy = false; if (!result?.ok) return showToast(result?.error?.message || '签到失败'); await loadConsumerUtility('points'); showToast(result.data?.idempotent ? '今天已经签到' : '签到成功'); });
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

document.addEventListener('submit', async event => {
  if (event.target.id === 'webLoginForm') {
    event.preventDefault(); const form = new FormData(event.target); return loginWithCredentials(String(form.get('loginId') || '').trim(), String(form.get('password') || ''));
  }
  if (event.target.id === 'webPasswordForm') {
    event.preventDefault(); const form = new FormData(event.target); const currentPassword = String(form.get('currentPassword') || ''); const newPassword = String(form.get('newPassword') || ''); if (newPassword !== String(form.get('confirmPassword') || '')) return showToast('两次输入的新密码不一致'); if (!window.confirm('确认修改网页登录密码？修改后当前会话将失效，需要重新登录。')) return; const result = await window.MengshixianApi.auth.changePassword({ currentPassword, newPassword }); if (!result?.ok) return showToast(result?.error?.message || '密码修改失败'); clearWebIdentity(); switchTab('mine'); openLogin(); return showToast('密码已修改，请重新登录');
  }
  if (event.target.id === 'remoteReviewForm') {
    event.preventDefault(); if (state.consumerBusy || !state.user.loggedIn) return;
    const form = new FormData(event.target); const [orderId, orderItemId] = String(form.get('eligible') || '').split('|'); if (!orderId || !orderItemId) return showToast('当前没有可评价商品'); state.consumerBusy = true;
    const result = await window.MengshixianApi.reviews.create({ orderId, orderItemId, rating: Number(form.get('rating')), content: String(form.get('content')).trim(), mediaIds: String(form.get('mediaIds') || '').split(/[,，\s]+/).filter(Boolean), idempotencyKey: `web-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    state.consumerBusy = false; if (!result?.ok) return showToast(result?.error?.message || '评价提交失败'); await loadConsumerUtility('review'); return showToast(result.data?.idempotent ? '评价已经提交' : '评价已提交审核');
  }
  if (event.target.id === 'remoteInvoiceTitleForm') {
    event.preventDefault(); const form = new FormData(event.target); const type = String(form.get('type'));
    const result = await window.MengshixianApi.invoiceTitles.save({ type, name: String(form.get('name')).trim(), taxNo: type === 'company' ? String(form.get('taxNo')).trim() : '', address: String(form.get('address')).trim(), bankName: String(form.get('bankName')).trim(), bankAccount: String(form.get('bankAccount')).trim() });
    if (!result?.ok) return showToast(result?.error?.message || '抬头保存失败'); await loadConsumerUtility('invoice'); return showToast('发票抬头已保存');
  }
  if (event.target.id === 'remoteInvoiceRequestForm') {
    event.preventDefault(); const form = new FormData(event.target);
    const result = await window.MengshixianApi.invoices.request({ orderId: String(form.get('orderId')).trim(), titleId: String(form.get('titleId')).trim(), email: String(form.get('email') || '').trim(), idempotencyKey: `web-invoice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    if (!result?.ok) return showToast(result?.error?.message || '开票申请失败'); await loadConsumerUtility('invoice'); return showToast(result.data?.invoice?.status === 'provider_unconfigured' ? '开票服务商未配置，申请已进入待处理状态' : '开票申请已提交');
  }
  if (event.target.id === 'topupIntentForm') {
    event.preventDefault(); const form = new FormData(event.target); const amountCent = Math.round(Number(form.get('amount')) * 100);
    const before = Number(state.storedValueAccount?.balanceCent || 0); const result = await window.MengshixianApi.storedValue.topupIntent({ amountCent, idempotencyKey: `web-topup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    if (!result?.ok) return showToast(result?.error?.message || '充值通道检查失败'); await loadConsumerUtility('storedValue'); const unchanged = Number(state.storedValueAccount?.balanceCent || 0) === before; return showToast(result.data?.intent?.status === 'unavailable' && unchanged ? '真实充值通道未配置，余额未发生变化' : '充值意向状态已更新，请以账户流水为准');
  }
  if (event.target.id === 'addressForm') {
    event.preventDefault();
    const form = new FormData(event.target);
    if (isRemoteCommerce()) {
      const existing = state.remoteAddresses.find(item => item._id === state.remoteAddressEditingId);
      const payload = { ...(existing ? { id: existing._id } : {}), name: String(form.get('name')).trim(), phone: String(form.get('phone')).trim(), regionCode: String(form.get('regionCode')).trim(), detail: String(form.get('detail')).trim(), tag: String(form.get('tag') || '').trim(), provinceCode: existing?.provinceCode || '', cityCode: existing?.cityCode || '', districtCode: existing?.districtCode || '', isDefault: form.get('isDefault') === 'on' || existing?.isDefault === true };
      const button = event.target.querySelector('button[type="submit"]'); if (button) { button.disabled = true; button.textContent = '正在保存…'; }
      const result = await window.MengshixianApi.address.save(payload);
      if (!result?.ok) { if (button) { button.disabled = false; button.textContent = existing ? '保存修改' : '新增地址'; } return showToast(result?.error?.message || '收货地址保存失败'); }
      state.remoteAddressEditingId = ''; await loadRemoteAddresses(); openUtility('address', '', true); return showToast('收货地址已保存');
    }
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
  if (event.target.id === 'aftersaleForm') {
    event.preventDefault();
    if (state.aftersaleSubmitting) return;
    const form = new FormData(event.target);
    const detail = state.remoteOrderDetail;
    const selectedItems = [...event.target.querySelectorAll('input[name="selectedItem"]:checked')];
    const items = selectedItems.map(input => {
      const index = Number(input.value); const source = detail?.items?.[index] || {};
      const quantity = Number(form.get(`quantity-${index}`));
      return { orderItemId: source._id || '', skuId: source.skuId || '', quantity, orderedQuantity: Number(source.quantity || 0) };
    }).filter(item => (item.orderItemId || item.skuId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= item.orderedQuantity)
      .map(({ orderedQuantity, ...item }) => item);
    if (!items.length || items.length !== selectedItems.length) return showToast('请至少选择一件商品，且售后数量不能超过购买数量');
    const mediaIds = [...new Set(String(form.get('mediaIds') || '').split(/\r?\n/).map(value => value.trim()).filter(Boolean))];
    const reasonCode = String(form.get('reasonCode') || ''); const description = String(form.get('description') || '').trim();
    if (!reasonCode || !description) return showToast('请填写售后原因和问题说明');
    if (mediaIds.length + state.aftersaleFiles.length > 9) return showToast('凭证素材最多 9 个');
    if (state.aftersaleFiles.some(file => !String(file.type || '').startsWith('image/') || Number(file.size || 0) > 4 * 1024 * 1024)) return showToast('凭证必须是 4MB 以内的图片');
    state.aftersaleSubmitting = true; renderUtility('aftersaleApply');
    try {
      for (const file of state.aftersaleFiles) {
        const uploaded = await window.MengshixianApi.refunds.uploadMedia({ type: 'image', fileName: file.name, mimeType: file.type, sizeBytes: file.size, contentBase64: await fileBase64(file) });
        if (!uploaded?.ok || !uploaded.data?.mediaId) throw new Error(uploaded?.error?.message || '凭证上传失败');
        mediaIds.push(uploaded.data.mediaId);
      }
    } catch (error) {
      state.aftersaleSubmitting = false; renderUtility('aftersaleApply'); return showToast(error.message || '凭证上传失败，请重试');
    }
    const payload = { orderId: detail.order._id, items, reasonCode, description, mediaIds, idempotencyKey: `web-refund-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    const response = await window.MengshixianApi.refunds.request(payload);
    state.aftersaleSubmitting = false;
    if (!response?.ok) { renderUtility('aftersaleApply'); return showToast(response?.error?.message || '售后申请提交失败，请重试'); }
    state.aftersaleFiles = [];
    openUtility('aftersale');
    showToast(response.data?.idempotent ? '该售后申请已提交，请勿重复操作' : '售后申请已提交');
  }
  if (event.target.id === 'inquiryForm') {
    event.preventDefault();
    if (!isVerifiedBusiness() || state.businessBusy) return showToast('仅已认证企业采购账号可以提交询价');
    const form = new FormData(event.target); const items = String(form.get('items') || '').split(/\r?\n/).map(line => {
      const [skuId, quantity] = line.split(/[,，\s]+/); return { skuId: String(skuId || '').trim(), quantity: Number(quantity) };
    }).filter(item => item.skuId && Number.isInteger(item.quantity) && item.quantity > 0);
    if (!items.length) return showToast('请按“SKU ID,数量”填写询价商品');
    state.businessBusy = true; renderUtility('inquiries');
    const result = await window.MengshixianApi.inquiries.create({ items, description: String(form.get('description') || '').trim(), idempotencyKey: `web-inquiry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    state.businessBusy = false;
    if (!result?.ok) { renderUtility('inquiries'); return showToast(result?.error?.message || '询价提交失败'); }
    await loadInquiries(); showToast(result.data?.idempotent ? '该询价已提交，请勿重复操作' : '询价已提交');
  }
});

document.addEventListener('change', event => {
  if (event.target.id === 'aftersaleFiles') { state.aftersaleFiles = [...(event.target.files || [])].slice(0, 9); renderUtility('aftersaleApply'); return; }
  if (event.target.matches('[data-cart-selected]')) { setRemoteCartSelected(event.target.dataset.cartSelected, event.target.checked); return; }
  if (event.target.id === 'remotePaymentMethod') { if (state.remotePaymentMethod !== event.target.value) state.remoteOrderIdempotencyKey = ''; state.remotePaymentMethod = event.target.value; return; }
  if (event.target.id === 'remoteCheckoutCoupon') { state.remoteCouponId = event.target.value; invalidateRemoteQuote(); renderUtility('checkout'); refreshRemoteCheckoutQuote(); return; }
  if (event.target.id === 'remoteCheckoutAddress') { state.remoteCheckoutAddress = state.remoteAddresses.find(item => item._id === event.target.value) || null; normalizeRemoteSelections(); invalidateRemoteQuote(); renderUtility('checkout'); refreshRemoteCheckoutQuote(); return; }
  if (event.target.id === 'remoteCheckoutWarehouse') { state.remoteWarehouseId = event.target.value; state.remoteDeliverySlotId = ''; normalizeRemoteSelections(); invalidateRemoteQuote(); renderUtility('checkout'); refreshRemoteCheckoutQuote(); return; }
  if (event.target.id === 'remoteCheckoutSlot') { state.remoteDeliverySlotId = event.target.value; invalidateRemoteQuote(); renderUtility('checkout'); refreshRemoteCheckoutQuote(); return; }
  if (event.target.id === 'remoteCheckoutPickup') { state.remotePickupSiteId = event.target.value; normalizeRemoteSelections(); invalidateRemoteQuote(); renderUtility('checkout'); refreshRemoteCheckoutQuote(); }
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
if (typeof window.addEventListener === 'function') window.addEventListener('mengshixian:auth-expired', event => { clearWebIdentity(event.detail?.message || '网页会话已失效，请重新登录'); switchTab('mine'); openLogin(); });
loadRemoteHomeContent();
loadRemoteCatalog();
loadRemoteCategories();
restoreWebSession();
if (bannerSlides.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(() => showBanner(activeBanner + 1), 4500);
