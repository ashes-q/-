(function initWorldMapCore(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.WorldMapCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : window, function createWorldMapCore() {
  const DEFAULT_RADIUS = 2.05;
  const DEFAULT_CAMERA_DISTANCE = 4.85;
  const MIN_CAMERA_DISTANCE = 2.18;
  const MAX_CAMERA_DISTANCE = 7.2;

  const CHINA_REGION = {
    id: "china",
    label: "China Terrain",
    center: { lat: 35.8, lng: 103.4 },
    bounds: { minLat: 18, maxLat: 54, minLng: 73, maxLng: 135 },
  };

  const MAP_LAYERS = [
    { id: "terrain", label: "地形网格" },
    { id: "blocks", label: "地貌板块" },
    { id: "water", label: "主干水系" },
    { id: "waterTributaries", label: "支流参考" },
    { id: "waterMinorTributaries", label: "细支流" },
    { id: "waterRefs", label: "湖泊参考" },
    { id: "coastRefs", label: "海岸参考" },
    { id: "borders", label: "边界" },
    { id: "provinceBorders", label: "省界参考" },
    { id: "cityBoundaries", label: "地级市界" },
    { id: "contours", label: "DEM 等高线" },
    { id: "details", label: "细节补丁" },
    { id: "traces", label: "临摹线" },
    { id: "suggestions", label: "候选补丁" },
    { id: "approved", label: "已审补丁" },
    { id: "sites", label: "观察点" },
    { id: "cities", label: "地级市" },
    { id: "weather", label: "天气云流" },
  ];
  const MAP_LAYER_GROUPS = [
    {
      id: "terrainOverview",
      label: "地形总览",
      layerIds: [
        "terrain",
        "borders",
        "water",
        "waterRefs",
        "blocks",
        "waterTributaries",
        "waterMinorTributaries",
        "coastRefs",
        "provinceBorders",
        "cityBoundaries",
        "contours",
        "details",
        "traces",
        "suggestions",
        "approved",
        "sites",
        "cities",
        "weather",
      ],
      primaryLayerIds: ["terrain", "blocks", "borders", "water", "waterRefs"],
    },
  ];
  const DEFAULT_HIDDEN_LAYERS = new Set(["waterTributaries", "waterMinorTributaries", "coastRefs", "provinceBorders", "cityBoundaries", "contours", "details", "traces", "suggestions", "approved", "sites", "cities", "weather"]);

  const CHINA_TERRAIN_SITES = [
    { id: "beijing", label: "Beijing", name: "北京", region: "华北平原北缘", lat: 39.9, lng: 116.4, elevation: 44, tone: "gold" },
    { id: "lhasa", label: "Lhasa", name: "拉萨", region: "青藏高原", lat: 29.65, lng: 91.13, elevation: 3650, tone: "ice" },
    { id: "urumqi", label: "Urumqi", name: "乌鲁木齐", region: "天山北麓", lat: 43.82, lng: 87.62, elevation: 800, tone: "sand" },
    { id: "chengdu", label: "Chengdu", name: "成都", region: "四川盆地", lat: 30.67, lng: 104.06, elevation: 500, tone: "green" },
    { id: "xian", label: "Xi'an", name: "西安", region: "关中平原", lat: 34.34, lng: 108.94, elevation: 405, tone: "gold" },
    { id: "shanghai", label: "Shanghai", name: "上海", region: "长江三角洲", lat: 31.23, lng: 121.47, elevation: 4, tone: "cyan" },
    { id: "guangzhou", label: "Guangzhou", name: "广州", region: "珠江三角洲", lat: 23.13, lng: 113.26, elevation: 21, tone: "green" },
    { id: "kunming", label: "Kunming", name: "昆明", region: "云贵高原", lat: 25.04, lng: 102.72, elevation: 1890, tone: "ice" },
  ];

  const CHINA_TERRAIN_CITIES = [
    { id: "chengdu", label: "Chengdu", name: "成都", province: "四川", kind: "prefecture", region: "成都平原", terrainBlockId: "chengdu-plain", lat: 30.67, lng: 104.06, tone: "green" },
    { id: "deyang", label: "Deyang", name: "德阳", province: "四川", kind: "prefecture", region: "成都平原", terrainBlockId: "chengdu-plain", lat: 31.13, lng: 104.40, tone: "green" },
    { id: "mianyang", label: "Mianyang", name: "绵阳", province: "四川", kind: "prefecture", region: "成都平原", terrainBlockId: "chengdu-plain", lat: 31.47, lng: 104.68, tone: "green" },
    { id: "meishan", label: "Meishan", name: "眉山", province: "四川", kind: "prefecture", region: "成都平原", terrainBlockId: "chengdu-plain", lat: 30.08, lng: 103.85, tone: "green" },
    { id: "hanzhong", label: "Hanzhong", name: "汉中", province: "陕西", kind: "prefecture", region: "汉中盆地", terrainBlockId: "hanzhong-basin", lat: 33.07, lng: 107.02, tone: "gold" },
    { id: "ankang", label: "Ankang", name: "安康", province: "陕西", kind: "prefecture", region: "安康汉江谷地", terrainBlockId: "ankang-han-river-valley", lat: 32.68, lng: 109.02, tone: "gold" },
    { id: "luoyang", label: "Luoyang", name: "洛阳", province: "河南", kind: "prefecture", region: "豫西伏牛-嵩山山地", terrainBlockId: "western-henan-funiu-songshan-mountains", lat: 34.62, lng: 112.45, tone: "gold" },
    { id: "nanyang", label: "Nanyang", name: "南阳", province: "河南", kind: "prefecture", region: "南阳盆地", terrainBlockId: "nanyang-basin", lat: 32.99, lng: 112.53, tone: "gold" },
    { id: "guiyang", label: "Guiyang", name: "贵阳", province: "贵州", kind: "prefecture", region: "黔中喀斯特高原", terrainBlockId: "qianzhong-karst-plateau", lat: 26.65, lng: 106.63, tone: "ice" },
    { id: "anshun", label: "Anshun", name: "安顺", province: "贵州", kind: "prefecture", region: "黔中喀斯特高原", terrainBlockId: "qianzhong-karst-plateau", lat: 26.25, lng: 105.93, tone: "ice" },
    { id: "jinan", label: "Jinan", name: "济南", province: "山东", kind: "prefecture", region: "山东丘陵", terrainBlockId: "shandong-hills", lat: 36.65, lng: 117.12, tone: "gold" },
    { id: "yantai", label: "Yantai", name: "烟台", province: "山东", kind: "prefecture", region: "胶东丘陵", terrainBlockId: "jiaodong-hills", lat: 37.46, lng: 121.45, tone: "cyan" },
    { id: "weihai", label: "Weihai", name: "威海", province: "山东", kind: "prefecture", region: "胶东丘陵", terrainBlockId: "jiaodong-hills", lat: 37.51, lng: 122.12, tone: "cyan" },
    { id: "linyi", label: "Linyi", name: "临沂", province: "山东", kind: "prefecture", region: "鲁中南山地", terrainBlockId: "luzhongnan-mountains", lat: 35.10, lng: 118.36, tone: "green" },
    { id: "taiyuan", label: "Taiyuan", name: "太原", province: "山西", kind: "prefecture", region: "太原盆地", terrainBlockId: "taiyuan-basin", lat: 37.87, lng: 112.55, tone: "gold" },
    { id: "xinzhou", label: "Xinzhou", name: "忻州", province: "山西", kind: "prefecture", region: "忻定盆地", terrainBlockId: "xinding-basin", lat: 38.42, lng: 112.73, tone: "gold" },
    { id: "linfen", label: "Linfen", name: "临汾", province: "山西", kind: "prefecture", region: "临汾盆地", terrainBlockId: "linfen-basin", lat: 36.08, lng: 111.52, tone: "gold" },
    { id: "yuncheng", label: "Yuncheng", name: "运城", province: "山西", kind: "prefecture", region: "运城盆地", terrainBlockId: "yuncheng-basin", lat: 35.03, lng: 111.00, tone: "gold" },
    { id: "yangquan", label: "Yangquan", name: "阳泉", province: "山西", kind: "prefecture", region: "阳泉-寿阳盆地", terrainBlockId: "yangquan-shouyang-basin", lat: 37.86, lng: 113.58, tone: "gold" },
    { id: "changzhi", label: "Changzhi", name: "长治", province: "山西", kind: "prefecture", region: "上党-长治盆地", terrainBlockId: "shangdang-changzhi-basin", lat: 36.20, lng: 113.12, tone: "gold" },
    { id: "zhangjiakou", label: "Zhangjiakou", name: "张家口", province: "河北", kind: "prefecture", region: "燕山-太行山地", terrainBlockId: "yan-taihang-mountains", lat: 40.77, lng: 114.89, tone: "ice" },
    { id: "baishan", label: "Baishan", name: "白山", province: "吉林", kind: "prefecture", region: "长白山火山山地", terrainBlockId: "changbai-volcanic-mountains", lat: 41.94, lng: 126.42, tone: "ice" },
    { id: "tonghua", label: "Tonghua", name: "通化", province: "吉林", kind: "prefecture", region: "长白山火山山地", terrainBlockId: "changbai-volcanic-mountains", lat: 41.73, lng: 125.94, tone: "ice" },
    { id: "yanji", label: "Yanji", name: "延吉", province: "吉林", kind: "prefecture", region: "延边-图们江盆地", terrainBlockId: "yanbian-tumen-basin", lat: 42.89, lng: 129.51, tone: "cyan" },
    { id: "mudanjiang", label: "Mudanjiang", name: "牡丹江", province: "黑龙江", kind: "prefecture", region: "牡丹江河谷盆地", terrainBlockId: "mudanjiang-valley-basin", lat: 44.58, lng: 129.60, tone: "cyan" },
    { id: "hulunbuir", label: "Hulunbuir", name: "呼伦贝尔", province: "内蒙古", kind: "prefecture", region: "呼伦贝尔草原高原", terrainBlockId: "hulunbuir-grassland-plateau", lat: 49.21, lng: 119.76, tone: "green" },
    { id: "manzhouli", label: "Manzhouli", name: "满洲里", province: "内蒙古", kind: "prefecture", region: "呼伦贝尔草原高原", terrainBlockId: "hulunbuir-grassland-plateau", lat: 49.60, lng: 117.43, tone: "green" },
    { id: "changsha", label: "Changsha", name: "长沙", province: "湖南", kind: "prefecture", region: "湘江长株潭盆地", terrainBlockId: "xiangjiang-changzhutan-basin", lat: 28.23, lng: 112.94, tone: "green" },
    { id: "zhuzhou", label: "Zhuzhou", name: "株洲", province: "湖南", kind: "prefecture", region: "湘江长株潭盆地", terrainBlockId: "xiangjiang-changzhutan-basin", lat: 27.83, lng: 113.13, tone: "green" },
    { id: "xiangtan", label: "Xiangtan", name: "湘潭", province: "湖南", kind: "prefecture", region: "湘江长株潭盆地", terrainBlockId: "xiangjiang-changzhutan-basin", lat: 27.83, lng: 112.94, tone: "green" },
    { id: "nanchang", label: "Nanchang", name: "南昌", province: "江西", kind: "prefecture", region: "鄱阳湖平原", terrainBlockId: "poyang-lake-plain", lat: 28.68, lng: 115.86, tone: "cyan" },
    { id: "jiujiang", label: "Jiujiang", name: "九江", province: "江西", kind: "prefecture", region: "鄱阳湖平原", terrainBlockId: "poyang-lake-plain", lat: 29.70, lng: 116.00, tone: "cyan" },
    { id: "jingdezhen", label: "Jingdezhen", name: "景德镇", province: "江西", kind: "prefecture", region: "江南丘陵", terrainBlockId: "jiangnan-hills", lat: 29.27, lng: 117.18, tone: "green" },
    { id: "shangrao", label: "Shangrao", name: "上饶", province: "江西", kind: "prefecture", region: "怀玉-信江丘陵", terrainBlockId: "huaiyu-xinjiang-hills", lat: 28.45, lng: 117.97, tone: "green" },
    { id: "yingtan", label: "Yingtan", name: "鹰潭", province: "江西", kind: "prefecture", region: "怀玉-信江丘陵", terrainBlockId: "huaiyu-xinjiang-hills", lat: 28.24, lng: 117.03, tone: "green" },
    { id: "heyuan", label: "Heyuan", name: "河源", province: "广东", kind: "prefecture", region: "东南丘陵", terrainBlockId: "southeast-hills", lat: 23.74, lng: 114.70, tone: "green" },
    { id: "guangzhou", label: "Guangzhou", name: "广州", province: "广东", kind: "prefecture", region: "珠江三角洲平原", terrainBlockId: "pearl-river-delta-plain", lat: 23.13, lng: 113.26, tone: "green" },
    { id: "foshan", label: "Foshan", name: "佛山", province: "广东", kind: "prefecture", region: "珠江三角洲平原", terrainBlockId: "pearl-river-delta-plain", lat: 23.02, lng: 113.12, tone: "green" },
    { id: "dongguan", label: "Dongguan", name: "东莞", province: "广东", kind: "prefecture", region: "珠江三角洲平原", terrainBlockId: "pearl-river-delta-plain", lat: 23.04, lng: 113.75, tone: "green" },
    { id: "shenzhen", label: "Shenzhen", name: "深圳", province: "广东", kind: "prefecture", region: "珠江三角洲平原", terrainBlockId: "pearl-river-delta-plain", lat: 22.54, lng: 114.06, tone: "green" },
    { id: "zhuhai", label: "Zhuhai", name: "珠海", province: "广东", kind: "prefecture", region: "珠江三角洲平原", terrainBlockId: "pearl-river-delta-plain", lat: 22.27, lng: 113.57, tone: "cyan" },
    { id: "shantou", label: "Shantou", name: "汕头", province: "广东", kind: "prefecture", region: "潮汕沿海平原", terrainBlockId: "chaoshan-coastal-plain", lat: 23.35, lng: 116.68, tone: "cyan" },
    { id: "zhanjiang", label: "Zhanjiang", name: "湛江", province: "广东", kind: "prefecture", region: "粤西-雷州沿海低地", terrainBlockId: "west-guangdong-leizhou-lowlands", lat: 21.27, lng: 110.36, tone: "cyan" },
    { id: "beihai", label: "Beihai", name: "北海", province: "广西", kind: "prefecture", region: "北部湾沿海低地", terrainBlockId: "beibu-gulf-coastal-lowlands", lat: 21.48, lng: 109.12, tone: "cyan" },
    { id: "fuzhou", label: "Fuzhou", name: "福州", province: "福建", kind: "prefecture", region: "闽浙沿海低地", terrainBlockId: "fujian-zhejiang-coastal-lowlands", lat: 26.08, lng: 119.30, tone: "cyan" },
    { id: "xiamen", label: "Xiamen", name: "厦门", province: "福建", kind: "prefecture", region: "闽浙沿海低地", terrainBlockId: "fujian-zhejiang-coastal-lowlands", lat: 24.48, lng: 118.08, tone: "cyan" },
    { id: "quanzhou", label: "Quanzhou", name: "泉州", province: "福建", kind: "prefecture", region: "闽浙沿海低地", terrainBlockId: "fujian-zhejiang-coastal-lowlands", lat: 24.87, lng: 118.68, tone: "cyan" },
    { id: "zhangzhou", label: "Zhangzhou", name: "漳州", province: "福建", kind: "prefecture", region: "闽浙沿海低地", terrainBlockId: "fujian-zhejiang-coastal-lowlands", lat: 24.51, lng: 117.66, tone: "cyan" },
    { id: "putian", label: "Putian", name: "莆田", province: "福建", kind: "prefecture", region: "闽浙沿海低地", terrainBlockId: "fujian-zhejiang-coastal-lowlands", lat: 25.43, lng: 119.01, tone: "cyan" },
    { id: "ningde", label: "Ningde", name: "宁德", province: "福建", kind: "prefecture", region: "闽浙沿海低地", terrainBlockId: "fujian-zhejiang-coastal-lowlands", lat: 26.66, lng: 119.52, tone: "cyan" },
    { id: "wenzhou", label: "Wenzhou", name: "温州", province: "浙江", kind: "prefecture", region: "闽浙沿海低地", terrainBlockId: "fujian-zhejiang-coastal-lowlands", lat: 27.99, lng: 120.70, tone: "cyan" },
    { id: "taizhou-zhejiang", label: "Taizhou", name: "台州", province: "浙江", kind: "prefecture", region: "闽浙沿海低地", terrainBlockId: "fujian-zhejiang-coastal-lowlands", lat: 28.66, lng: 121.42, tone: "cyan" },
    { id: "hangzhou", label: "Hangzhou", name: "杭州", province: "浙江", kind: "prefecture", region: "杭嘉湖-宁绍平原", terrainBlockId: "hangjiahu-ningshao-plains", lat: 30.27, lng: 120.15, tone: "cyan" },
    { id: "jiaxing", label: "Jiaxing", name: "嘉兴", province: "浙江", kind: "prefecture", region: "杭嘉湖-宁绍平原", terrainBlockId: "hangjiahu-ningshao-plains", lat: 30.75, lng: 120.76, tone: "cyan" },
    { id: "huzhou", label: "Huzhou", name: "湖州", province: "浙江", kind: "prefecture", region: "杭嘉湖-宁绍平原", terrainBlockId: "hangjiahu-ningshao-plains", lat: 30.89, lng: 120.09, tone: "cyan" },
    { id: "shaoxing", label: "Shaoxing", name: "绍兴", province: "浙江", kind: "prefecture", region: "杭嘉湖-宁绍平原", terrainBlockId: "hangjiahu-ningshao-plains", lat: 30.00, lng: 120.58, tone: "cyan" },
    { id: "ningbo", label: "Ningbo", name: "宁波", province: "浙江", kind: "prefecture", region: "杭嘉湖-宁绍平原", terrainBlockId: "hangjiahu-ningshao-plains", lat: 29.87, lng: 121.55, tone: "cyan" },
    { id: "nanjing", label: "Nanjing", name: "南京", province: "江苏", kind: "prefecture", region: "宁镇-茅山丘陵", terrainBlockId: "ningzhen-maoshan-hills", lat: 32.06, lng: 118.80, tone: "green" },
    { id: "zhenjiang", label: "Zhenjiang", name: "镇江", province: "江苏", kind: "prefecture", region: "长江中下游平原", terrainBlockId: "middle-lower-yangtze-plain", lat: 32.19, lng: 119.42, tone: "cyan" },
    { id: "changzhou", label: "Changzhou", name: "常州", province: "江苏", kind: "prefecture", region: "太湖-长三角平原", terrainBlockId: "taihu-yangtze-delta-plain", lat: 31.81, lng: 119.97, tone: "cyan" },
    { id: "wuxi", label: "Wuxi", name: "无锡", province: "江苏", kind: "prefecture", region: "太湖-长三角平原", terrainBlockId: "taihu-yangtze-delta-plain", lat: 31.49, lng: 120.31, tone: "cyan" },
    { id: "suzhou", label: "Suzhou", name: "苏州", province: "江苏", kind: "prefecture", region: "太湖-长三角平原", terrainBlockId: "taihu-yangtze-delta-plain", lat: 31.30, lng: 120.58, tone: "cyan" },
    { id: "nantong", label: "Nantong", name: "南通", province: "江苏", kind: "prefecture", region: "江淮-里下河平原", terrainBlockId: "jianghuai-lixiahe-plain", lat: 31.98, lng: 120.89, tone: "cyan" },
    { id: "shanghai", label: "Shanghai", name: "上海", province: "上海", kind: "prefecture", region: "长江中下游平原", terrainBlockId: "middle-lower-yangtze-plain", lat: 31.23, lng: 121.47, tone: "cyan" },
    { id: "yangzhou", label: "Yangzhou", name: "扬州", province: "江苏", kind: "prefecture", region: "江淮-里下河平原", terrainBlockId: "jianghuai-lixiahe-plain", lat: 32.39, lng: 119.42, tone: "cyan" },
    { id: "taizhou-jiangsu", label: "Taizhou", name: "泰州", province: "江苏", kind: "prefecture", region: "江淮-里下河平原", terrainBlockId: "jianghuai-lixiahe-plain", lat: 32.49, lng: 119.91, tone: "cyan" },
    { id: "huaian", label: "Huai'an", name: "淮安", province: "江苏", kind: "prefecture", region: "江淮-里下河平原", terrainBlockId: "jianghuai-lixiahe-plain", lat: 33.61, lng: 119.02, tone: "cyan" },
    { id: "yancheng", label: "Yancheng", name: "盐城", province: "江苏", kind: "prefecture", region: "江淮-里下河平原", terrainBlockId: "jianghuai-lixiahe-plain", lat: 33.35, lng: 120.16, tone: "cyan" },
    { id: "bengbu", label: "Bengbu", name: "蚌埠", province: "安徽", kind: "prefecture", region: "江淮-里下河平原", terrainBlockId: "jianghuai-lixiahe-plain", lat: 32.92, lng: 117.38, tone: "cyan" },
    { id: "huainan", label: "Huainan", name: "淮南", province: "安徽", kind: "prefecture", region: "江淮-里下河平原", terrainBlockId: "jianghuai-lixiahe-plain", lat: 32.63, lng: 117.00, tone: "cyan" },
    { id: "hefei", label: "Hefei", name: "合肥", province: "安徽", kind: "prefecture", region: "合肥-巢湖低丘平原", terrainBlockId: "hefei-chaohu-low-hills", lat: 31.82, lng: 117.23, tone: "green" },
    { id: "luan", label: "Lu'an", name: "六安", province: "安徽", kind: "prefecture", region: "皖西江淮丘陵", terrainBlockId: "wanxi-jianghuai-hills", lat: 31.75, lng: 116.51, tone: "green" },
    { id: "anqing", label: "Anqing", name: "安庆", province: "安徽", kind: "prefecture", region: "长江中下游平原", terrainBlockId: "middle-lower-yangtze-plain", lat: 30.54, lng: 117.06, tone: "cyan" },
    { id: "wuhu", label: "Wuhu", name: "芜湖", province: "安徽", kind: "prefecture", region: "长江中下游平原", terrainBlockId: "middle-lower-yangtze-plain", lat: 31.35, lng: 118.43, tone: "cyan" },
    { id: "maanshan", label: "Ma'anshan", name: "马鞍山", province: "安徽", kind: "prefecture", region: "长江中下游平原", terrainBlockId: "middle-lower-yangtze-plain", lat: 31.67, lng: 118.51, tone: "cyan" },
    { id: "chuzhou", label: "Chuzhou", name: "滁州", province: "安徽", kind: "prefecture", region: "江淮-里下河平原", terrainBlockId: "jianghuai-lixiahe-plain", lat: 32.30, lng: 118.32, tone: "cyan" },
    { id: "fuyang-anhui", label: "Fuyang", name: "阜阳", province: "安徽", kind: "prefecture", region: "黄淮-苏北平原", terrainBlockId: "huanghuai-north-jiangsu-plain", lat: 32.89, lng: 115.81, tone: "green" },
    { id: "bozhou", label: "Bozhou", name: "亳州", province: "安徽", kind: "prefecture", region: "黄淮-苏北平原", terrainBlockId: "huanghuai-north-jiangsu-plain", lat: 33.86, lng: 115.78, tone: "green" },
    { id: "huaibei", label: "Huaibei", name: "淮北", province: "安徽", kind: "prefecture", region: "黄淮-苏北平原", terrainBlockId: "huanghuai-north-jiangsu-plain", lat: 33.96, lng: 116.79, tone: "green" },
    { id: "suzhou-anhui", label: "Suzhou", name: "宿州", province: "安徽", kind: "prefecture", region: "黄淮-苏北平原", terrainBlockId: "huanghuai-north-jiangsu-plain", lat: 33.65, lng: 116.96, tone: "green" },
    { id: "xuzhou", label: "Xuzhou", name: "徐州", province: "江苏", kind: "prefecture", region: "黄淮-苏北平原", terrainBlockId: "huanghuai-north-jiangsu-plain", lat: 34.26, lng: 117.20, tone: "green" },
    { id: "suqian", label: "Suqian", name: "宿迁", province: "江苏", kind: "prefecture", region: "黄淮-苏北平原", terrainBlockId: "huanghuai-north-jiangsu-plain", lat: 33.96, lng: 118.28, tone: "green" },
    { id: "lianyungang", label: "Lianyungang", name: "连云港", province: "江苏", kind: "prefecture", region: "黄淮-苏北平原", terrainBlockId: "huanghuai-north-jiangsu-plain", lat: 34.60, lng: 119.22, tone: "cyan" },
  ];

  const FIVE_TERRAIN_BLOCKS = [
    { id: "southeast-tibet-gorges", name: "藏东南峡谷", tier: 2, tone: "green", center: { lat: 29.55, lng: 95.0 }, polygon: [{ lat: 28.75, lng: 93.75 }, { lat: 29.45, lng: 93.70 }, { lat: 30.15, lng: 94.55 }, { lat: 30.15, lng: 96.15 }, { lat: 29.55, lng: 96.35 }, { lat: 28.75, lng: 95.45 }] },
    { id: "himalaya-mountains", name: "喜马拉雅山脉", tier: 1, tone: "snow", center: { lat: 28.4, lng: 88.8 }, polygon: [{ lat: 27.1, lng: 78.0 }, { lat: 28.7, lng: 80.0 }, { lat: 28.95, lng: 88.0 }, { lat: 29.4, lng: 95.6 }, { lat: 28.8, lng: 97.5 }, { lat: 27.6, lng: 92.0 }, { lat: 27.4, lng: 86.5 }] },
    { id: "kunlun-mountains", name: "昆仑山脉", tier: 1, tone: "snow", center: { lat: 36.0, lng: 87.5 }, polygon: [{ lat: 35.1, lng: 76.5 }, { lat: 37.8, lng: 79.4 }, { lat: 37.5, lng: 86.5 }, { lat: 36.05, lng: 94.5 }, { lat: 35.3, lng: 97.0 }, { lat: 34.6, lng: 94.0 }, { lat: 35.1, lng: 87.0 }, { lat: 35.8, lng: 80.5 }] },
    { id: "qaidam-basin", name: "柴达木盆地", tier: 2, tone: "sand", center: { lat: 36.8, lng: 95.3 }, polygon: [{ lat: 35.8, lng: 90.5 }, { lat: 37.8, lng: 91.2 }, { lat: 38.6, lng: 95.8 }, { lat: 38.0, lng: 99.5 }, { lat: 36.0, lng: 99.4 }, { lat: 35.95, lng: 96.0 }] },
    { id: "gannan-aba-plateau", name: "甘南-阿坝高原草地", tier: 2, tone: "green", center: { lat: 33.4, lng: 102.3 }, polygon: [{ lat: 31.55, lng: 101.25 }, { lat: 32.55, lng: 100.95 }, { lat: 34.10, lng: 101.45 }, { lat: 35.25, lng: 102.25 }, { lat: 35.18, lng: 103.18 }, { lat: 34.15, lng: 103.45 }, { lat: 33.25, lng: 103.25 }, { lat: 32.30, lng: 102.82 }, { lat: 31.72, lng: 102.55 }] },
    { id: "qinghai-tibet-plateau", name: "青藏高原", tier: 1, tone: "snow", center: { lat: 32.5, lng: 88.5 }, polygon: [{ lat: 28.6, lng: 78 }, { lat: 35, lng: 76 }, { lat: 39, lng: 87 }, { lat: 38, lng: 99 }, { lat: 37.2, lng: 102.2 }, { lat: 35.35, lng: 102.35 }, { lat: 34.30, lng: 101.25 }, { lat: 31.1, lng: 98.0 }, { lat: 30.2, lng: 96.3 }, { lat: 29.75, lng: 93.0 }, { lat: 28.8, lng: 91 }, { lat: 28.6, lng: 84 }] },
    { id: "tarim-basin", name: "塔里木盆地", tier: 2, tone: "sand", center: { lat: 40.1, lng: 83.4 }, polygon: [{ lat: 36.2, lng: 75 }, { lat: 39.2, lng: 74.5 }, { lat: 41.4, lng: 76.8 }, { lat: 42.6, lng: 84.8 }, { lat: 41.6, lng: 91.8 }, { lat: 38.2, lng: 91.2 }, { lat: 36.1, lng: 84.5 }] },
    { id: "ili-valley", name: "伊犁河谷", tier: 3, tone: "waterplain", center: { lat: 43.6, lng: 82.1 }, polygon: [{ lat: 43.55, lng: 80.05 }, { lat: 44.32, lng: 80.02 }, { lat: 44.35, lng: 81.55 }, { lat: 44.02, lng: 82.65 }, { lat: 43.58, lng: 83.55 }, { lat: 43.42, lng: 84.35 }, { lat: 43.05, lng: 84.28 }, { lat: 42.92, lng: 83.10 }, { lat: 42.90, lng: 81.05 }, { lat: 43.35, lng: 80.65 }] },
    { id: "altai-mountains", name: "阿尔泰山脉", tier: 1, tone: "snow", center: { lat: 47.6, lng: 88.8 }, polygon: [{ lat: 45.7, lng: 84.0 }, { lat: 47.4, lng: 84.5 }, { lat: 49.2, lng: 88.2 }, { lat: 48.4, lng: 91.9 }, { lat: 46.9, lng: 90.8 }, { lat: 46.2, lng: 87.2 }] },
    { id: "junggar-basin", name: "准噶尔盆地", tier: 2, tone: "sand", center: { lat: 45.1, lng: 86.7 }, polygon: [{ lat: 44.45, lng: 80.55 }, { lat: 45.1, lng: 80.5 }, { lat: 46.2, lng: 85.5 }, { lat: 45.7, lng: 91.8 }, { lat: 44.0, lng: 91.1 }, { lat: 43.95, lng: 88.05 }, { lat: 43.1, lng: 86.2 }, { lat: 43.55, lng: 84.0 }, { lat: 44.05, lng: 82.35 }] },
    { id: "turpan-hami-basin", name: "吐鲁番-哈密盆地", tier: 3, tone: "sand", center: { lat: 42.7, lng: 91.4 }, polygon: [{ lat: 42.0, lng: 87.8 }, { lat: 43.35, lng: 88.4 }, { lat: 43.4, lng: 94.8 }, { lat: 42.3, lng: 95.0 }, { lat: 41.6, lng: 92.6 }, { lat: 41.8, lng: 89.2 }] },
    { id: "tian-shan-mountains", name: "天山山脉", tier: 1, tone: "snow", center: { lat: 42.6, lng: 85.8 }, polygon: [{ lat: 40.7, lng: 75.5 }, { lat: 42.7, lng: 76.8 }, { lat: 44.3, lng: 84.2 }, { lat: 44.1, lng: 89.6 }, { lat: 43.6, lng: 94.5 }, { lat: 43.25, lng: 89.0 }, { lat: 41.2, lng: 82.0 }, { lat: 40.4, lng: 81.0 }] },
    { id: "hexi-corridor", name: "河西走廊", tier: 3, tone: "sand", center: { lat: 39.1, lng: 100.0 }, polygon: [{ lat: 39.4, lng: 94.0 }, { lat: 40.9, lng: 94.5 }, { lat: 40.4, lng: 98.0 }, { lat: 39.8, lng: 102.8 }, { lat: 38.5, lng: 103.2 }, { lat: 37.75, lng: 102.75 }, { lat: 38.15, lng: 101.6 }, { lat: 38.45, lng: 100.4 }, { lat: 39.0, lng: 96.4 }] },
    { id: "qilian-mountains", name: "祁连山脉", tier: 1, tone: "snow", center: { lat: 37.4, lng: 99.5 }, polygon: [{ lat: 37.1, lng: 97.2 }, { lat: 38.55, lng: 99.4 }, { lat: 38.10, lng: 101.55 }, { lat: 37.0, lng: 102.3 }, { lat: 36.4, lng: 99.4 }] },
    { id: "ningxia-plain", name: "宁夏平原", tier: 3, tone: "waterplain", center: { lat: 38.45, lng: 106.25 }, polygon: [{ lat: 37.55, lng: 105.82 }, { lat: 38.25, lng: 105.72 }, { lat: 39.25, lng: 105.95 }, { lat: 39.42, lng: 106.62 }, { lat: 38.75, lng: 106.88 }, { lat: 37.80, lng: 106.62 }] },
    { id: "hetao-tumochuan-plain", name: "河套-土默川平原", tier: 3, tone: "waterplain", center: { lat: 40.72, lng: 109.35 }, polygon: [{ lat: 40.18, lng: 106.45 }, { lat: 40.70, lng: 106.65 }, { lat: 41.18, lng: 107.55 }, { lat: 41.22, lng: 108.85 }, { lat: 41.05, lng: 110.45 }, { lat: 40.98, lng: 112.25 }, { lat: 40.55, lng: 112.35 }, { lat: 40.20, lng: 111.35 }, { lat: 40.24, lng: 109.90 }, { lat: 40.36, lng: 108.15 }, { lat: 40.28, lng: 107.10 }] },
    { id: "alxa-plateau-desert", name: "阿拉善高原荒漠", tier: 2, tone: "sand", center: { lat: 39.2, lng: 104.5 }, polygon: [{ lat: 37.0, lng: 101.0 }, { lat: 40.8, lng: 100.7 }, { lat: 42.2, lng: 104.6 }, { lat: 40.4, lng: 106.0 }, { lat: 38.0, lng: 105.95 }, { lat: 37.4, lng: 104.8 }] },
    { id: "ordos-maowusu-plateau", name: "鄂尔多斯-毛乌素高原", tier: 2, tone: "sand", center: { lat: 39.2, lng: 109.4 }, polygon: [{ lat: 37.95, lng: 106.85 }, { lat: 39.7, lng: 106.85 }, { lat: 40.35, lng: 108.25 }, { lat: 40.15, lng: 110.9 }, { lat: 39.2, lng: 111.35 }, { lat: 38.45, lng: 110.45 }, { lat: 38.55, lng: 108.0 }] },
    { id: "hebei-bashang-plateau", name: "河北坝上高原", tier: 2, tone: "loess", center: { lat: 41.65, lng: 116.15 }, polygon: [{ lat: 40.98, lng: 114.25 }, { lat: 41.82, lng: 114.15 }, { lat: 42.55, lng: 116.05 }, { lat: 42.58, lng: 117.55 }, { lat: 42.08, lng: 118.10 }, { lat: 41.18, lng: 117.05 }, { lat: 41.05, lng: 115.35 }] },
    { id: "inner-mongolia-plateau", name: "内蒙古高原", tier: 2, tone: "loess", center: { lat: 43.2, lng: 111.5 }, polygon: [{ lat: 40, lng: 103 }, { lat: 45, lng: 102 }, { lat: 49, lng: 111 }, { lat: 48, lng: 119 }, { lat: 43, lng: 120 }, { lat: 42.65, lng: 117.35 }, { lat: 42.15, lng: 115.85 }, { lat: 41.90, lng: 114.35 }, { lat: 41.15, lng: 114.0 }] },
    { id: "guanzhong-plain", name: "关中平原", tier: 3, tone: "plain", center: { lat: 34.45, lng: 108.8 }, polygon: [{ lat: 34.12, lng: 106.55 }, { lat: 34.68, lng: 106.65 }, { lat: 35.02, lng: 108.2 }, { lat: 34.96, lng: 110.35 }, { lat: 34.45, lng: 110.55 }, { lat: 34.18, lng: 109.2 }, { lat: 34.10, lng: 107.4 }] },
    { id: "longmen-mountains", name: "龙门山", tier: 2, tone: "snow", center: { lat: 31.55, lng: 104.0 }, polygon: [{ lat: 31.05, lng: 103.25 }, { lat: 31.55, lng: 103.15 }, { lat: 32.15, lng: 104.10 }, { lat: 32.05, lng: 104.70 }, { lat: 31.65, lng: 104.82 }, { lat: 31.12, lng: 103.92 }] },
    { id: "minshan-mountains", name: "岷山", tier: 2, tone: "snow", center: { lat: 32.95, lng: 103.95 }, polygon: [{ lat: 32.15, lng: 102.75 }, { lat: 33.45, lng: 102.95 }, { lat: 34.05, lng: 104.05 }, { lat: 33.58, lng: 105.15 }, { lat: 32.55, lng: 104.55 }, { lat: 32.10, lng: 103.45 }] },
    { id: "three-gorges-wushan-hills", name: "三峡-巫山山地峡谷", tier: 2, tone: "karst", center: { lat: 30.85, lng: 110.75 }, polygon: [{ lat: 30.40, lng: 109.95 }, { lat: 31.08, lng: 109.95 }, { lat: 31.28, lng: 110.45 }, { lat: 31.10, lng: 111.30 }, { lat: 30.82, lng: 111.55 }, { lat: 30.42, lng: 111.45 }, { lat: 30.28, lng: 110.75 }] },
    { id: "han-river-valley", name: "汉江中游谷地", tier: 3, tone: "waterplain", center: { lat: 32.15, lng: 111.95 }, polygon: [{ lat: 31.55, lng: 111.20 }, { lat: 32.22, lng: 111.18 }, { lat: 32.70, lng: 111.48 }, { lat: 32.66, lng: 112.08 }, { lat: 32.25, lng: 112.62 }, { lat: 31.72, lng: 112.55 }, { lat: 31.55, lng: 111.90 }] },
    { id: "western-henan-funiu-songshan-mountains", name: "豫西伏牛-嵩山山地", tier: 2, tone: "karst", center: { lat: 33.95, lng: 112.05 }, polygon: [{ lat: 33.15, lng: 110.95 }, { lat: 34.10, lng: 110.75 }, { lat: 34.85, lng: 111.38 }, { lat: 34.75, lng: 112.65 }, { lat: 34.55, lng: 113.18 }, { lat: 34.18, lng: 113.20 }, { lat: 33.70, lng: 112.42 }, { lat: 33.22, lng: 111.35 }] },
    { id: "nanyang-basin", name: "南阳盆地", tier: 3, tone: "basin", center: { lat: 32.92, lng: 112.35 }, polygon: [{ lat: 32.45, lng: 111.62 }, { lat: 32.88, lng: 111.45 }, { lat: 33.35, lng: 111.78 }, { lat: 33.45, lng: 112.65 }, { lat: 33.15, lng: 113.25 }, { lat: 32.62, lng: 113.20 }, { lat: 32.28, lng: 112.55 }] },
    { id: "tongbai-dabie-mountains", name: "桐柏-大别山地", tier: 2, tone: "green", center: { lat: 31.95, lng: 114.15 }, polygon: [{ lat: 31.45, lng: 113.20 }, { lat: 32.08, lng: 113.10 }, { lat: 32.58, lng: 113.45 }, { lat: 32.55, lng: 114.35 }, { lat: 32.10, lng: 115.20 }, { lat: 31.45, lng: 115.25 }, { lat: 31.28, lng: 114.30 }] },
    { id: "hanzhong-basin", name: "汉中盆地", tier: 3, tone: "basin", center: { lat: 33.12, lng: 107.08 }, polygon: [{ lat: 32.90, lng: 106.35 }, { lat: 33.25, lng: 106.25 }, { lat: 33.40, lng: 107.20 }, { lat: 33.30, lng: 107.78 }, { lat: 32.98, lng: 107.75 }, { lat: 32.84, lng: 106.82 }] },
    { id: "ankang-han-river-valley", name: "安康汉江谷地", tier: 3, tone: "waterplain", center: { lat: 32.82, lng: 108.85 }, polygon: [{ lat: 32.55, lng: 108.02 }, { lat: 33.12, lng: 108.05 }, { lat: 33.18, lng: 108.48 }, { lat: 32.96, lng: 109.62 }, { lat: 32.62, lng: 109.82 }, { lat: 32.45, lng: 109.05 }, { lat: 32.68, lng: 108.32 }] },
    { id: "daba-mountains", name: "大巴山地", tier: 2, tone: "green", center: { lat: 32.45, lng: 107.55 }, polygon: [{ lat: 32.05, lng: 105.75 }, { lat: 32.78, lng: 105.95 }, { lat: 33.00, lng: 106.45 }, { lat: 32.82, lng: 107.25 }, { lat: 32.78, lng: 108.25 }, { lat: 32.48, lng: 108.72 }, { lat: 32.05, lng: 108.20 }] },
    { id: "chengdu-plain", name: "成都平原", tier: 3, tone: "waterplain", center: { lat: 30.75, lng: 104.10 }, polygon: [{ lat: 29.85, lng: 103.55 }, { lat: 30.42, lng: 103.35 }, { lat: 31.20, lng: 103.55 }, { lat: 31.66, lng: 104.55 }, { lat: 31.38, lng: 104.95 }, { lat: 30.55, lng: 104.65 }, { lat: 29.95, lng: 104.20 }] },
    { id: "central-sichuan-hills", name: "川中丘陵", tier: 3, tone: "green", center: { lat: 30.15, lng: 105.45 }, polygon: [{ lat: 29.05, lng: 104.25 }, { lat: 30.05, lng: 104.35 }, { lat: 31.05, lng: 105.05 }, { lat: 31.18, lng: 106.25 }, { lat: 30.70, lng: 106.45 }, { lat: 29.45, lng: 105.60 }, { lat: 29.05, lng: 105.00 }] },
    { id: "eastern-sichuan-parallel-ridge-valleys", name: "川东平行岭谷", tier: 2, tone: "karst", center: { lat: 30.35, lng: 107.35 }, polygon: [{ lat: 29.00, lng: 106.10 }, { lat: 30.20, lng: 106.10 }, { lat: 31.55, lng: 106.95 }, { lat: 31.45, lng: 108.65 }, { lat: 30.65, lng: 108.92 }, { lat: 29.50, lng: 107.25 }] },
    { id: "qinling-daba-mountains", name: "秦岭-大巴山地", tier: 2, tone: "snow", center: { lat: 32.8, lng: 108.7 }, polygon: [{ lat: 31.0, lng: 104.8 }, { lat: 33.6, lng: 105.5 }, { lat: 34.3, lng: 107.5 }, { lat: 34.2, lng: 110.2 }, { lat: 32.5, lng: 111.5 }, { lat: 31.0, lng: 110.6 }, { lat: 30.6, lng: 108.2 }, { lat: 31.3, lng: 106.2 }] },
    { id: "xinding-basin", name: "忻定盆地", tier: 3, tone: "basin", center: { lat: 38.43, lng: 112.72 }, polygon: [{ lat: 38.05, lng: 112.20 }, { lat: 38.68, lng: 112.18 }, { lat: 38.82, lng: 112.86 }, { lat: 38.55, lng: 113.18 }, { lat: 38.15, lng: 113.05 }] },
    { id: "taiyuan-basin", name: "太原盆地", tier: 3, tone: "basin", center: { lat: 37.70, lng: 112.58 }, polygon: [{ lat: 37.25, lng: 112.05 }, { lat: 37.95, lng: 112.08 }, { lat: 38.15, lng: 112.58 }, { lat: 37.95, lng: 113.02 }, { lat: 37.35, lng: 112.95 }, { lat: 37.18, lng: 112.45 }] },
    { id: "linfen-basin", name: "临汾盆地", tier: 3, tone: "basin", center: { lat: 36.02, lng: 111.55 }, polygon: [{ lat: 35.42, lng: 110.95 }, { lat: 36.38, lng: 111.05 }, { lat: 36.55, lng: 111.75 }, { lat: 35.98, lng: 112.05 }, { lat: 35.42, lng: 111.62 }] },
    { id: "yuncheng-basin", name: "运城盆地", tier: 3, tone: "basin", center: { lat: 35.02, lng: 110.85 }, polygon: [{ lat: 34.55, lng: 110.05 }, { lat: 35.30, lng: 110.00 }, { lat: 35.55, lng: 110.80 }, { lat: 35.35, lng: 111.55 }, { lat: 34.80, lng: 111.45 }, { lat: 34.58, lng: 110.72 }] },
    { id: "yangquan-shouyang-basin", name: "阳泉-寿阳盆地", tier: 3, tone: "basin", center: { lat: 37.88, lng: 113.35 }, polygon: [{ lat: 37.55, lng: 112.95 }, { lat: 38.05, lng: 112.95 }, { lat: 38.15, lng: 113.52 }, { lat: 37.88, lng: 113.78 }, { lat: 37.55, lng: 113.58 }] },
    { id: "shangdang-changzhi-basin", name: "上党-长治盆地", tier: 3, tone: "basin", center: { lat: 36.18, lng: 113.05 }, polygon: [{ lat: 35.72, lng: 112.55 }, { lat: 36.35, lng: 112.50 }, { lat: 36.55, lng: 113.18 }, { lat: 36.28, lng: 113.55 }, { lat: 35.78, lng: 113.30 }] },
    { id: "luliang-mountains", name: "吕梁山地", tier: 2, tone: "loess", center: { lat: 37.50, lng: 111.25 }, polygon: [{ lat: 34.95, lng: 110.65 }, { lat: 35.80, lng: 110.35 }, { lat: 37.40, lng: 110.45 }, { lat: 38.60, lng: 111.00 }, { lat: 39.30, lng: 111.75 }, { lat: 38.70, lng: 112.00 }, { lat: 37.70, lng: 111.70 }, { lat: 36.50, lng: 111.35 }, { lat: 35.30, lng: 111.05 }] },
    { id: "zhongtiao-mountains", name: "中条山地", tier: 2, tone: "karst", center: { lat: 35.25, lng: 111.55 }, polygon: [{ lat: 35.12, lng: 111.10 }, { lat: 35.32, lng: 111.05 }, { lat: 35.65, lng: 111.42 }, { lat: 35.50, lng: 112.20 }, { lat: 35.08, lng: 112.02 }, { lat: 34.95, lng: 111.45 }] },
    { id: "loess-plateau", name: "黄土高原", tier: 2, tone: "loess", center: { lat: 36.9, lng: 108.5 }, polygon: [{ lat: 34.6, lng: 103.2 }, { lat: 37.2, lng: 103.8 }, { lat: 37.6, lng: 105.4 }, { lat: 37.4, lng: 106.4 }, { lat: 38.45, lng: 108.7 }, { lat: 38.45, lng: 111.2 }, { lat: 38.45, lng: 113.05 }, { lat: 35, lng: 112 }, { lat: 34.6, lng: 109 }, { lat: 34.6, lng: 103.2 }] },
    { id: "liangshan-panxi-mountains", name: "凉山-攀西山地", tier: 2, tone: "karst", center: { lat: 27.35, lng: 102.0 }, polygon: [{ lat: 26.10, lng: 101.00 }, { lat: 27.20, lng: 101.05 }, { lat: 28.55, lng: 101.85 }, { lat: 28.45, lng: 102.80 }, { lat: 27.00, lng: 102.75 }, { lat: 26.05, lng: 102.05 }] },
    { id: "wumeng-mountains", name: "乌蒙山地", tier: 2, tone: "karst", center: { lat: 27.0, lng: 104.2 }, polygon: [{ lat: 25.92, lng: 102.78 }, { lat: 26.85, lng: 102.58 }, { lat: 28.45, lng: 103.32 }, { lat: 28.35, lng: 104.72 }, { lat: 27.55, lng: 105.72 }, { lat: 26.38, lng: 105.35 }, { lat: 25.72, lng: 104.35 }] },
    { id: "sichuan-basin", name: "四川盆地", tier: 2, tone: "basin", center: { lat: 30.5, lng: 104.5 }, polygon: [{ lat: 28.55, lng: 104.20 }, { lat: 29.2, lng: 102.6 }, { lat: 30.95, lng: 103.35 }, { lat: 31.30, lng: 104.15 }, { lat: 31.62, lng: 104.95 }, { lat: 32.55, lng: 105.75 }, { lat: 31.82, lng: 107.95 }, { lat: 30.7, lng: 108.8 }, { lat: 28.3, lng: 106.2 }] },
    { id: "dehong-river-valleys", name: "德宏河谷低地", tier: 3, tone: "waterplain", center: { lat: 24.35, lng: 98.05 }, polygon: [{ lat: 23.75, lng: 97.45 }, { lat: 24.62, lng: 97.42 }, { lat: 24.86, lng: 97.88 }, { lat: 24.72, lng: 98.28 }, { lat: 24.48, lng: 98.64 }, { lat: 24.20, lng: 98.60 }, { lat: 23.86, lng: 98.22 }] },
    { id: "hengduan-mountains", name: "横断山脉", tier: 1, tone: "snow", center: { lat: 28.6, lng: 100.5 }, polygon: [{ lat: 24.2, lng: 97.8 }, { lat: 30.8, lng: 98.2 }, { lat: 32.7, lng: 101.2 }, { lat: 31.2, lng: 102.8 }, { lat: 27.0, lng: 101.9 }, { lat: 24.2, lng: 100.5 }] },
    { id: "western-yunnan-mountain-valleys", name: "滇西南山地河谷", tier: 2, tone: "green", center: { lat: 23.65, lng: 99.55 }, polygon: [{ lat: 22.85, lng: 98.55 }, { lat: 24.12, lng: 98.65 }, { lat: 24.55, lng: 99.35 }, { lat: 24.20, lng: 100.45 }, { lat: 23.45, lng: 100.45 }, { lat: 22.80, lng: 99.75 }] },
    { id: "southern-yunnan-valleys", name: "滇南低山河谷", tier: 3, tone: "green", center: { lat: 22.35, lng: 101.1 }, polygon: [{ lat: 21.15, lng: 99.7 }, { lat: 22.95, lng: 99.75 }, { lat: 24.05, lng: 100.75 }, { lat: 23.75, lng: 102.35 }, { lat: 22.45, lng: 102.65 }, { lat: 21.10, lng: 101.80 }] },
    { id: "red-river-ailao-valley", name: "红河-哀牢山河谷", tier: 3, tone: "green", center: { lat: 22.9, lng: 103.45 }, polygon: [{ lat: 22.42, lng: 103.82 }, { lat: 22.68, lng: 102.95 }, { lat: 23.18, lng: 102.62 }, { lat: 23.30, lng: 102.86 }, { lat: 23.22, lng: 103.16 }, { lat: 23.12, lng: 103.72 }, { lat: 22.72, lng: 104.10 }, { lat: 22.42, lng: 104.05 }] },
    { id: "southeast-yunnan-karst-plateau", name: "滇东南喀斯特高原", tier: 2, tone: "karst", center: { lat: 23.75, lng: 104.75 }, polygon: [{ lat: 22.95, lng: 103.85 }, { lat: 23.55, lng: 103.75 }, { lat: 24.35, lng: 104.05 }, { lat: 24.40, lng: 105.15 }, { lat: 23.75, lng: 105.65 }, { lat: 23.05, lng: 105.15 }] },
    { id: "qiandongnan-miaoling-mountains", name: "黔东南苗岭-侗乡山地", tier: 2, tone: "karst", center: { lat: 26.15, lng: 108.55 }, polygon: [{ lat: 25.55, lng: 107.80 }, { lat: 26.45, lng: 107.55 }, { lat: 26.85, lng: 108.15 }, { lat: 26.45, lng: 109.30 }, { lat: 25.80, lng: 109.35 }, { lat: 25.45, lng: 108.75 }] },
    { id: "qianzhong-karst-plateau", name: "黔中喀斯特高原", tier: 3, tone: "karst", center: { lat: 26.48, lng: 106.38 }, polygon: [{ lat: 25.85, lng: 105.55 }, { lat: 26.55, lng: 105.35 }, { lat: 27.15, lng: 106.05 }, { lat: 27.02, lng: 107.05 }, { lat: 26.32, lng: 107.28 }, { lat: 25.82, lng: 106.45 }] },
    { id: "qianbei-dalou-mountains", name: "黔北大娄山地", tier: 2, tone: "karst", center: { lat: 27.92, lng: 106.85 }, polygon: [{ lat: 27.28, lng: 106.05 }, { lat: 28.32, lng: 105.98 }, { lat: 28.72, lng: 106.72 }, { lat: 28.35, lng: 107.62 }, { lat: 27.52, lng: 107.45 }, { lat: 27.20, lng: 106.70 }] },
    { id: "qianxinan-karst-plateau", name: "黔西南喀斯特高原", tier: 3, tone: "karst", center: { lat: 25.35, lng: 104.72 }, polygon: [{ lat: 24.72, lng: 104.18 }, { lat: 25.70, lng: 104.02 }, { lat: 26.08, lng: 104.72 }, { lat: 25.78, lng: 105.42 }, { lat: 24.95, lng: 105.58 }, { lat: 24.62, lng: 104.88 }] },
    { id: "qiannan-karst-hills", name: "黔南喀斯特丘陵", tier: 3, tone: "karst", center: { lat: 25.85, lng: 107.70 }, polygon: [{ lat: 25.18, lng: 107.12 }, { lat: 26.24, lng: 107.02 }, { lat: 26.48, lng: 107.62 }, { lat: 26.10, lng: 108.35 }, { lat: 25.22, lng: 108.25 }, { lat: 24.98, lng: 107.58 }] },
    { id: "yunnan-guizhou-plateau", name: "云贵高原", tier: 2, tone: "karst", center: { lat: 25.7, lng: 104 }, polygon: [{ lat: 23.6, lng: 101.0 }, { lat: 25.2, lng: 101.0 }, { lat: 25.72, lng: 103.75 }, { lat: 26.15, lng: 105.55 }, { lat: 27.85, lng: 106.55 }, { lat: 28, lng: 108 }, { lat: 26.75, lng: 107.55 }, { lat: 25.1, lng: 107.5 }, { lat: 24.6, lng: 106.0 }, { lat: 23.5, lng: 104.5 }, { lat: 23.2, lng: 102.5 }] },
    { id: "songnen-plain", name: "松嫩平原", tier: 3, tone: "waterplain", center: { lat: 46.8, lng: 125.1 }, polygon: [{ lat: 44.85, lng: 121.95 }, { lat: 46.25, lng: 121.40 }, { lat: 48.55, lng: 123.35 }, { lat: 49.35, lng: 125.25 }, { lat: 48.50, lng: 126.85 }, { lat: 47.20, lng: 127.65 }, { lat: 45.35, lng: 126.95 }, { lat: 44.65, lng: 124.35 }] },
    { id: "hulunbuir-grassland-plateau", name: "呼伦贝尔草原高原", tier: 2, tone: "green", center: { lat: 49.35, lng: 118.25 }, polygon: [{ lat: 47.75, lng: 115.15 }, { lat: 50.55, lng: 115.45 }, { lat: 50.80, lng: 119.85 }, { lat: 50.25, lng: 120.42 }, { lat: 49.45, lng: 120.25 }, { lat: 48.70, lng: 119.58 }, { lat: 47.85, lng: 118.20 }] },
    { id: "greater-khingan-mountains", name: "大兴安岭", tier: 2, tone: "snow", center: { lat: 49.2, lng: 121.6 }, polygon: [{ lat: 46.0, lng: 118.8 }, { lat: 48.75, lng: 120.05 }, { lat: 50.35, lng: 120.85 }, { lat: 52.0, lng: 122.0 }, { lat: 51.2, lng: 125.2 }, { lat: 48.2, lng: 123.4 }, { lat: 46.2, lng: 120.5 }] },
    { id: "sanjiang-plain", name: "三江平原", tier: 3, tone: "waterplain", center: { lat: 47.3, lng: 132.2 }, polygon: [{ lat: 45.55, lng: 129.20 }, { lat: 46.90, lng: 129.20 }, { lat: 48.70, lng: 130.55 }, { lat: 48.82, lng: 134.70 }, { lat: 47.35, lng: 134.80 }, { lat: 45.95, lng: 133.20 }, { lat: 45.20, lng: 131.20 }] },
    { id: "lesser-khingan-mountains", name: "小兴安岭", tier: 2, tone: "snow", center: { lat: 48.2, lng: 128.5 }, polygon: [{ lat: 46.90, lng: 127.15 }, { lat: 48.0, lng: 126.55 }, { lat: 50.55, lng: 126.85 }, { lat: 50.40, lng: 128.70 }, { lat: 48.55, lng: 130.05 }, { lat: 47.25, lng: 130.00 }, { lat: 46.45, lng: 128.80 }] },
    { id: "changbai-volcanic-mountains", name: "长白山火山山地", tier: 1, tone: "snow", center: { lat: 42.05, lng: 127.15 }, polygon: [{ lat: 41.25, lng: 125.25 }, { lat: 42.05, lng: 125.40 }, { lat: 42.55, lng: 126.40 }, { lat: 42.40, lng: 128.25 }, { lat: 41.95, lng: 128.65 }, { lat: 41.45, lng: 127.35 }, { lat: 41.30, lng: 126.05 }] },
    { id: "yanbian-tumen-basin", name: "延边-图们江盆地", tier: 3, tone: "waterplain", center: { lat: 42.86, lng: 129.85 }, polygon: [{ lat: 42.50, lng: 128.95 }, { lat: 43.18, lng: 129.10 }, { lat: 43.25, lng: 130.10 }, { lat: 42.98, lng: 130.80 }, { lat: 42.50, lng: 130.55 }, { lat: 42.35, lng: 129.70 }] },
    { id: "mudanjiang-valley-basin", name: "牡丹江河谷盆地", tier: 3, tone: "waterplain", center: { lat: 44.48, lng: 129.55 }, polygon: [{ lat: 43.95, lng: 128.85 }, { lat: 44.78, lng: 128.95 }, { lat: 45.05, lng: 129.75 }, { lat: 44.68, lng: 130.25 }, { lat: 44.05, lng: 129.98 }, { lat: 43.90, lng: 129.30 }] },
    { id: "zhangguangcai-laoye-mountains", name: "张广才岭-老爷岭山地", tier: 2, tone: "snow", center: { lat: 44.05, lng: 129.45 }, polygon: [{ lat: 43.05, lng: 127.35 }, { lat: 44.05, lng: 127.55 }, { lat: 45.05, lng: 129.05 }, { lat: 45.15, lng: 131.45 }, { lat: 44.35, lng: 131.75 }, { lat: 43.55, lng: 130.40 }, { lat: 43.10, lng: 128.70 }] },
    { id: "northeast-mountains", name: "长白山-东北东部山地", tier: 2, tone: "snow", center: { lat: 43.5, lng: 129.2 }, polygon: [{ lat: 41.4, lng: 125.0 }, { lat: 42.0, lng: 125.2 }, { lat: 43.0, lng: 127.0 }, { lat: 45.2, lng: 128.0 }, { lat: 47.0, lng: 131.8 }, { lat: 44.0, lng: 134.0 }, { lat: 41.4, lng: 130.4 }, { lat: 40.8, lng: 127.2 }] },
    { id: "liaoxi-corridor-coastal-lowlands", name: "辽西走廊沿海低地", tier: 3, tone: "waterplain", center: { lat: 40.45, lng: 120.35 }, polygon: [{ lat: 39.70, lng: 119.35 }, { lat: 40.12, lng: 119.50 }, { lat: 40.55, lng: 120.15 }, { lat: 40.92, lng: 120.55 }, { lat: 41.25, lng: 121.05 }, { lat: 41.22, lng: 121.45 }, { lat: 40.92, lng: 121.40 }, { lat: 40.42, lng: 120.95 }, { lat: 39.88, lng: 120.10 }] },
    { id: "liaohe-plain", name: "辽河平原", tier: 3, tone: "waterplain", center: { lat: 41.25, lng: 122.55 }, polygon: [{ lat: 40.35, lng: 121.35 }, { lat: 41.55, lng: 121.55 }, { lat: 42.15, lng: 123.35 }, { lat: 41.70, lng: 123.58 }, { lat: 40.95, lng: 123.35 }, { lat: 40.42, lng: 122.78 }] },
    { id: "liaodong-hills", name: "辽东丘陵", tier: 2, tone: "karst", center: { lat: 40.55, lng: 123.70 }, polygon: [{ lat: 38.4, lng: 120.7 }, { lat: 39.3, lng: 121.0 }, { lat: 40.20, lng: 122.25 }, { lat: 40.25, lng: 122.95 }, { lat: 41.18, lng: 123.38 }, { lat: 42.10, lng: 123.85 }, { lat: 41.60, lng: 125.30 }, { lat: 40.1, lng: 125.2 }, { lat: 38.6, lng: 123.5 }] },
    { id: "northeast-plain", name: "东北平原", tier: 3, tone: "plain", center: { lat: 43.5, lng: 124.8 }, polygon: [{ lat: 42.20, lng: 121.90 }, { lat: 44.25, lng: 121.60 }, { lat: 44.70, lng: 123.10 }, { lat: 44.55, lng: 125.80 }, { lat: 43.50, lng: 127.20 }, { lat: 42.30, lng: 126.70 }, { lat: 42.0, lng: 124.0 }] },
    { id: "datong-basin", name: "大同盆地", tier: 3, tone: "basin", center: { lat: 40.05, lng: 113.25 }, polygon: [{ lat: 39.55, lng: 112.25 }, { lat: 40.38, lng: 112.35 }, { lat: 40.55, lng: 113.65 }, { lat: 40.08, lng: 114.10 }, { lat: 39.55, lng: 113.62 }] },
    { id: "jianghuai-lixiahe-plain", name: "江淮-里下河低地", tier: 3, tone: "waterplain", center: { lat: 32.9, lng: 119.0 }, polygon: [{ lat: 31.78, lng: 120.95 }, { lat: 32.00, lng: 120.30 }, { lat: 32.28, lng: 119.85 }, { lat: 32.15, lng: 119.10 }, { lat: 32.30, lng: 117.25 }, { lat: 31.78, lng: 116.85 }, { lat: 32.20, lng: 116.20 }, { lat: 32.95, lng: 116.55 }, { lat: 33.75, lng: 118.35 }, { lat: 33.95, lng: 120.30 }, { lat: 33.45, lng: 121.12 }] },
    { id: "lianyungang-yuntai-mountains", name: "连云港云台山地", tier: 3, tone: "green", center: { lat: 34.57, lng: 119.27 }, polygon: [{ lat: 34.42, lng: 119.08 }, { lat: 34.58, lng: 119.05 }, { lat: 34.72, lng: 119.22 }, { lat: 34.69, lng: 119.43 }, { lat: 34.50, lng: 119.45 }, { lat: 34.42, lng: 119.28 }] },
    { id: "xuzhou-low-hills", name: "徐州低山丘陵", tier: 3, tone: "green", center: { lat: 34.34, lng: 117.34 }, polygon: [{ lat: 34.12, lng: 117.05 }, { lat: 34.30, lng: 117.02 }, { lat: 34.56, lng: 117.34 }, { lat: 34.52, lng: 117.58 }, { lat: 34.28, lng: 117.50 }, { lat: 34.12, lng: 117.28 }] },
    { id: "huanghuai-north-jiangsu-plain", name: "黄淮-苏北平原", tier: 3, tone: "plain", center: { lat: 33.8, lng: 117.45 }, polygon: [{ lat: 32.72, lng: 115.28 }, { lat: 33.46, lng: 115.12 }, { lat: 34.88, lng: 116.35 }, { lat: 34.92, lng: 119.45 }, { lat: 34.48, lng: 119.62 }, { lat: 33.82, lng: 118.42 }, { lat: 33.42, lng: 117.62 }, { lat: 33.18, lng: 116.40 }, { lat: 32.82, lng: 115.86 }] },
    { id: "ningzhen-maoshan-hills", name: "宁镇-茅山丘陵", tier: 3, tone: "green", center: { lat: 31.96, lng: 119.12 }, polygon: [{ lat: 31.72, lng: 118.88 }, { lat: 31.92, lng: 118.70 }, { lat: 32.17, lng: 118.82 }, { lat: 32.25, lng: 119.15 }, { lat: 32.12, lng: 119.45 }, { lat: 31.78, lng: 119.42 }, { lat: 31.68, lng: 119.18 }] },
    { id: "yili-hills", name: "宜溧丘陵", tier: 3, tone: "green", center: { lat: 31.34, lng: 119.58 }, polygon: [{ lat: 31.16, lng: 119.18 }, { lat: 31.42, lng: 119.18 }, { lat: 31.66, lng: 119.52 }, { lat: 31.55, lng: 119.88 }, { lat: 31.22, lng: 119.98 }, { lat: 31.05, lng: 119.62 }] },
    { id: "taihu-yangtze-delta-plain", name: "太湖-长三角平原", tier: 3, tone: "waterplain", center: { lat: 31.45, lng: 120.55 }, polygon: [{ lat: 31.12, lng: 119.95 }, { lat: 31.78, lng: 119.78 }, { lat: 32.08, lng: 119.88 }, { lat: 31.92, lng: 120.42 }, { lat: 31.62, lng: 121.30 }, { lat: 31.12, lng: 121.18 }, { lat: 30.86, lng: 120.55 }, { lat: 30.96, lng: 120.05 }] },
    { id: "north-china-plain", name: "华北平原", tier: 3, tone: "plain", center: { lat: 36.8, lng: 116.3 }, polygon: [{ lat: 32.5, lng: 112.0 }, { lat: 35.2, lng: 111.8 }, { lat: 38.9, lng: 114.1 }, { lat: 40.4, lng: 116.8 }, { lat: 40.05, lng: 118.95 }, { lat: 39.72, lng: 119.18 }, { lat: 37.2, lng: 119.2 }, { lat: 36.9, lng: 117.4 }, { lat: 36.45, lng: 116.65 }, { lat: 34.0, lng: 118.4 }, { lat: 32.8, lng: 120.0 }] },
    { id: "yan-taihang-mountains", name: "燕山-太行山", tier: 2, tone: "snow", center: { lat: 38.8, lng: 114.2 }, polygon: [{ lat: 34.2, lng: 110.1 }, { lat: 37.2, lng: 111.4 }, { lat: 40.9, lng: 113.8 }, { lat: 41.6, lng: 118.4 }, { lat: 40.55, lng: 118.85 }, { lat: 40.05, lng: 117.5 }, { lat: 38.0, lng: 116.2 }, { lat: 35.4, lng: 113.2 }] },
    { id: "liaoxi-yanshan-hills", name: "辽西丘陵-燕山北麓", tier: 2, tone: "karst", center: { lat: 41.75, lng: 120.0 }, polygon: [{ lat: 40.65, lng: 118.55 }, { lat: 41.55, lng: 118.25 }, { lat: 42.75, lng: 118.55 }, { lat: 42.95, lng: 120.25 }, { lat: 42.30, lng: 121.95 }, { lat: 41.25, lng: 121.35 }, { lat: 40.75, lng: 120.20 }, { lat: 40.85, lng: 119.05 }] },
    { id: "jiaodong-hills", name: "胶东丘陵", tier: 2, tone: "green", center: { lat: 36.85, lng: 121.25 }, polygon: [{ lat: 35.55, lng: 119.85 }, { lat: 36.15, lng: 119.75 }, { lat: 37.05, lng: 120.05 }, { lat: 37.80, lng: 121.05 }, { lat: 37.72, lng: 122.45 }, { lat: 36.95, lng: 122.75 }, { lat: 36.05, lng: 121.25 }, { lat: 35.70, lng: 120.25 }] },
    { id: "luzhongnan-mountains", name: "鲁中南山地", tier: 2, tone: "karst", center: { lat: 35.65, lng: 118.05 }, polygon: [{ lat: 34.92, lng: 117.20 }, { lat: 35.18, lng: 116.92 }, { lat: 36.32, lng: 116.95 }, { lat: 36.58, lng: 117.45 }, { lat: 36.25, lng: 118.28 }, { lat: 35.82, lng: 119.05 }, { lat: 35.00, lng: 119.05 }, { lat: 34.72, lng: 118.20 }] },
    { id: "shandong-hills", name: "山东丘陵", tier: 2, tone: "karst", center: { lat: 36.7, lng: 120.4 }, polygon: [{ lat: 34.92, lng: 117.25 }, { lat: 36.2, lng: 116.7 }, { lat: 36.72, lng: 116.82 }, { lat: 36.95, lng: 118.05 }, { lat: 38.3, lng: 120.0 }, { lat: 37.8, lng: 122.8 }, { lat: 36.1, lng: 122.2 }, { lat: 35.3, lng: 120.0 }, { lat: 34.94, lng: 118.50 }] },
    { id: "luoxiao-wugong-mountains", name: "罗霄-武功山地", tier: 2, tone: "green", center: { lat: 27.35, lng: 114.25 }, polygon: [{ lat: 26.55, lng: 113.72 }, { lat: 27.05, lng: 113.58 }, { lat: 27.85, lng: 113.72 }, { lat: 28.08, lng: 114.72 }, { lat: 27.55, lng: 114.88 }, { lat: 26.60, lng: 114.55 }, { lat: 26.35, lng: 114.05 }] },
    { id: "wuling-mountains", name: "武陵山地", tier: 2, tone: "karst", center: { lat: 29.2, lng: 110.0 }, polygon: [{ lat: 27.4, lng: 108.2 }, { lat: 29.2, lng: 108.5 }, { lat: 30.8, lng: 109.3 }, { lat: 30.4, lng: 110.4 }, { lat: 29.25, lng: 111.0 }, { lat: 28.0, lng: 110.5 }, { lat: 27.4, lng: 109.2 }] },
    { id: "xuefeng-mountains", name: "雪峰山地", tier: 2, tone: "green", center: { lat: 27.65, lng: 110.65 }, polygon: [{ lat: 26.72, lng: 109.72 }, { lat: 27.42, lng: 109.35 }, { lat: 28.18, lng: 110.10 }, { lat: 28.42, lng: 110.82 }, { lat: 28.08, lng: 111.48 }, { lat: 27.42, lng: 111.55 }, { lat: 26.72, lng: 110.82 }] },
    { id: "xiangjiang-changzhutan-basin", name: "湘江长株潭盆地", tier: 3, tone: "waterplain", center: { lat: 28.00, lng: 113.02 }, polygon: [{ lat: 27.48, lng: 112.62 }, { lat: 28.50, lng: 112.58 }, { lat: 28.58, lng: 113.18 }, { lat: 28.18, lng: 113.48 }, { lat: 27.68, lng: 113.38 }, { lat: 27.48, lng: 112.92 }] },
    { id: "xiangzhong-hills-basins", name: "湘中丘陵盆地", tier: 3, tone: "green", center: { lat: 27.25, lng: 112.10 }, polygon: [{ lat: 26.55, lng: 111.25 }, { lat: 27.25, lng: 111.15 }, { lat: 27.88, lng: 111.82 }, { lat: 28.02, lng: 112.25 }, { lat: 27.55, lng: 112.78 }, { lat: 26.72, lng: 112.82 }, { lat: 26.48, lng: 112.20 }] },
    { id: "xiangnan-hills-basins", name: "湘南丘陵盆地", tier: 3, tone: "green", center: { lat: 26.30, lng: 111.70 }, polygon: [{ lat: 25.95, lng: 111.25 }, { lat: 26.58, lng: 111.18 }, { lat: 26.72, lng: 111.78 }, { lat: 26.50, lng: 112.15 }, { lat: 26.12, lng: 112.08 }, { lat: 25.95, lng: 111.65 }] },
    { id: "dabie-mountains", name: "大别山", tier: 2, tone: "snow", center: { lat: 31.1, lng: 115.8 }, polygon: [{ lat: 30.55, lng: 114.6 }, { lat: 31.25, lng: 114.5 }, { lat: 32.0, lng: 115.8 }, { lat: 31.55, lng: 116.45 }, { lat: 31.10, lng: 116.70 }, { lat: 30.72, lng: 116.55 }, { lat: 30.35, lng: 115.55 }] },
    { id: "wanxi-jianghuai-hills", name: "皖西江淮丘陵", tier: 3, tone: "green", center: { lat: 31.10, lng: 116.80 }, polygon: [{ lat: 30.20, lng: 116.10 }, { lat: 30.55, lng: 116.92 }, { lat: 31.10, lng: 117.45 }, { lat: 31.62, lng: 117.18 }, { lat: 31.86, lng: 116.60 }, { lat: 31.55, lng: 116.28 }, { lat: 30.80, lng: 116.58 }, { lat: 30.38, lng: 116.15 }] },
    { id: "hefei-chaohu-low-hills", name: "合肥-巢湖低丘平原", tier: 3, tone: "plain", center: { lat: 31.68, lng: 117.55 }, polygon: [{ lat: 31.18, lng: 117.18 }, { lat: 31.58, lng: 116.92 }, { lat: 31.98, lng: 117.08 }, { lat: 32.08, lng: 117.48 }, { lat: 31.82, lng: 117.98 }, { lat: 31.45, lng: 118.12 }, { lat: 31.22, lng: 117.70 }] },
    { id: "lushan-mountains", name: "庐山", tier: 2, tone: "snow", center: { lat: 29.55, lng: 115.98 }, polygon: [{ lat: 29.34, lng: 115.78 }, { lat: 29.66, lng: 115.80 }, { lat: 29.68, lng: 116.08 }, { lat: 29.48, lng: 116.17 }, { lat: 29.30, lng: 116.00 }] },
    { id: "poyang-lake-plain", name: "鄱阳湖平原", tier: 3, tone: "waterplain", center: { lat: 29.05, lng: 116.20 }, polygon: [{ lat: 28.25, lng: 115.35 }, { lat: 28.75, lng: 115.20 }, { lat: 29.25, lng: 115.42 }, { lat: 29.42, lng: 115.78 }, { lat: 29.60, lng: 115.78 }, { lat: 29.64, lng: 115.92 }, { lat: 29.85, lng: 115.96 }, { lat: 29.82, lng: 116.20 }, { lat: 29.62, lng: 116.55 }, { lat: 29.00, lng: 116.86 }, { lat: 28.35, lng: 116.50 }] },
    { id: "huaiyu-xinjiang-hills", name: "怀玉-信江丘陵", tier: 3, tone: "green", center: { lat: 28.65, lng: 117.45 }, polygon: [{ lat: 27.90, lng: 116.55 }, { lat: 28.25, lng: 116.70 }, { lat: 28.85, lng: 117.12 }, { lat: 29.38, lng: 117.55 }, { lat: 29.35, lng: 118.25 }, { lat: 28.75, lng: 118.28 }, { lat: 28.18, lng: 117.80 }, { lat: 27.92, lng: 117.05 }] },
    { id: "wannan-mountains", name: "皖南山地", tier: 2, tone: "green", center: { lat: 30.20, lng: 118.05 }, polygon: [{ lat: 29.35, lng: 117.10 }, { lat: 29.55, lng: 118.95 }, { lat: 30.25, lng: 119.25 }, { lat: 30.82, lng: 118.65 }, { lat: 30.76, lng: 117.70 }, { lat: 30.22, lng: 117.22 }, { lat: 29.62, lng: 117.35 }] },
    { id: "tianmu-mogan-fuchun-hills", name: "天目-莫干-富春丘陵", tier: 2, tone: "green", center: { lat: 30.25, lng: 119.65 }, polygon: [{ lat: 29.58, lng: 119.20 }, { lat: 29.78, lng: 119.92 }, { lat: 30.10, lng: 120.04 }, { lat: 30.42, lng: 119.94 }, { lat: 30.74, lng: 119.92 }, { lat: 30.88, lng: 119.55 }, { lat: 30.55, lng: 119.22 }, { lat: 30.06, lng: 119.10 }] },
    { id: "kuaiji-siming-hills", name: "会稽-四明丘陵", tier: 3, tone: "green", center: { lat: 29.60, lng: 120.55 }, polygon: [{ lat: 29.32, lng: 120.00 }, { lat: 29.78, lng: 120.02 }, { lat: 29.94, lng: 120.35 }, { lat: 29.86, lng: 120.95 }, { lat: 29.48, lng: 121.10 }, { lat: 29.25, lng: 120.55 }] },
    { id: "hangjiahu-ningshao-plains", name: "杭嘉湖-宁绍平原", tier: 3, tone: "waterplain", center: { lat: 30.25, lng: 120.75 }, polygon: [{ lat: 30.10, lng: 120.05 }, { lat: 30.48, lng: 119.93 }, { lat: 30.78, lng: 119.98 }, { lat: 31.12, lng: 119.45 }, { lat: 31.20, lng: 121.35 }, { lat: 30.40, lng: 122.05 }, { lat: 29.70, lng: 121.85 }, { lat: 29.78, lng: 121.30 }, { lat: 29.95, lng: 120.95 }, { lat: 29.88, lng: 120.42 }] },
    { id: "middle-lower-yangtze-plain", name: "长江中下游平原", tier: 3, tone: "waterplain", center: { lat: 30.6, lng: 116.8 }, polygon: [{ lat: 28.05, lng: 111.6 }, { lat: 29.10, lng: 111.2 }, { lat: 30.65, lng: 111.58 }, { lat: 31.75, lng: 111.1 }, { lat: 32.55, lng: 116.75 }, { lat: 32.25, lng: 119.45 }, { lat: 31.5, lng: 122.5 }, { lat: 30.4, lng: 121.6 }, { lat: 30.98, lng: 118.95 }, { lat: 30.82, lng: 118.50 }, { lat: 30.78, lng: 118.00 }, { lat: 30.48, lng: 117.55 }, { lat: 30.25, lng: 117.25 }, { lat: 29.15, lng: 116.75 }, { lat: 28.35, lng: 116.6 }, { lat: 28.45, lng: 114.0 }] },
    { id: "zhezhong-zhenan-hills-basins", name: "浙中浙南丘陵盆地", tier: 3, tone: "green", center: { lat: 28.85, lng: 119.45 }, polygon: [{ lat: 28.20, lng: 118.35 }, { lat: 29.25, lng: 118.35 }, { lat: 29.55, lng: 119.45 }, { lat: 29.35, lng: 120.05 }, { lat: 28.60, lng: 120.35 }, { lat: 28.20, lng: 119.95 }, { lat: 28.10, lng: 119.00 }] },
    { id: "jiangnan-hills", name: "江南丘陵", tier: 3, tone: "karst", center: { lat: 29.6, lng: 117.4 }, polygon: [{ lat: 28.8, lng: 115.2 }, { lat: 30.7, lng: 115.6 }, { lat: 31.0, lng: 118.6 }, { lat: 29.4, lng: 120.0 }, { lat: 28.6, lng: 118.0 }] },
    { id: "guangxi-karst-basin", name: "广西喀斯特盆地丘陵", tier: 3, tone: "karst", center: { lat: 24.0, lng: 109.2 }, polygon: [{ lat: 22.1, lng: 106.2 }, { lat: 24.0, lng: 106.4 }, { lat: 25.45, lng: 107.15 }, { lat: 25.30, lng: 107.72 }, { lat: 25.32, lng: 108.92 }, { lat: 25.52, lng: 110.65 }, { lat: 24.4, lng: 111.3 }, { lat: 22.8, lng: 110.4 }, { lat: 22.1, lng: 108.3 }] },
    { id: "southeast-guangxi-hills-basins", name: "桂东南丘陵盆地", tier: 3, tone: "karst", center: { lat: 22.95, lng: 110.75 }, polygon: [{ lat: 22.35, lng: 109.90 }, { lat: 23.00, lng: 109.95 }, { lat: 23.68, lng: 111.12 }, { lat: 23.48, lng: 111.58 }, { lat: 22.50, lng: 111.22 }, { lat: 22.22, lng: 110.22 }] },
    { id: "nanling-mountains", name: "南岭山地", tier: 2, tone: "karst", center: { lat: 25.1, lng: 113.5 }, polygon: [{ lat: 23.60, lng: 112.70 }, { lat: 24.0, lng: 110.2 }, { lat: 25.4, lng: 110.6 }, { lat: 26.5, lng: 113.2 }, { lat: 26.22, lng: 114.05 }, { lat: 25.55, lng: 114.55 }, { lat: 25.15, lng: 115.35 }, { lat: 24.3, lng: 115.8 }, { lat: 23.95, lng: 114.10 }, { lat: 23.60, lng: 113.00 }] },
    { id: "fujian-zhejiang-coastal-lowlands", name: "闽浙沿海低地", tier: 3, tone: "waterplain", center: { lat: 26.35, lng: 119.5 }, polygon: [{ lat: 23.85, lng: 117.25 }, { lat: 24.75, lng: 117.45 }, { lat: 25.4, lng: 118.35 }, { lat: 26.2, lng: 118.85 }, { lat: 28.25, lng: 120.0 }, { lat: 29.05, lng: 121.25 }, { lat: 28.55, lng: 122.05 }, { lat: 27.1, lng: 121.25 }, { lat: 25.4, lng: 119.55 }, { lat: 24.3, lng: 118.45 }] },
    { id: "southeast-hills", name: "东南丘陵", tier: 3, tone: "karst", center: { lat: 26.5, lng: 117.1 }, polygon: [{ lat: 24.1, lng: 110.6 }, { lat: 26.7, lng: 112.4 }, { lat: 28.3, lng: 115.5 }, { lat: 29.2, lng: 118.2 }, { lat: 28.35, lng: 119.55 }, { lat: 27.1, lng: 119.35 }, { lat: 25.2, lng: 118.3 }, { lat: 23.95, lng: 117.25 }, { lat: 23.58, lng: 115.10 }, { lat: 23.55, lng: 114.48 }, { lat: 23.95, lng: 113.85 }, { lat: 24.2, lng: 112.0 }] },
    { id: "chaoshan-coastal-plain", name: "潮汕沿海平原", tier: 3, tone: "waterplain", center: { lat: 23.25, lng: 116.25 }, polygon: [{ lat: 22.55, lng: 115.05 }, { lat: 23.30, lng: 115.15 }, { lat: 23.85, lng: 116.15 }, { lat: 23.88, lng: 116.85 }, { lat: 23.35, lng: 117.25 }, { lat: 22.70, lng: 116.20 }] },
    { id: "pearl-river-delta-plain", name: "珠江三角洲平原", tier: 3, tone: "waterplain", center: { lat: 22.8, lng: 113.5 }, polygon: [{ lat: 22.0, lng: 112.1 }, { lat: 23.6, lng: 112.0 }, { lat: 23.45, lng: 113.85 }, { lat: 23.25, lng: 114.55 }, { lat: 22.4, lng: 114.9 }, { lat: 21.8, lng: 113.4 }] },
    { id: "west-guangdong-leizhou-lowlands", name: "粤西-雷州沿海低地", tier: 3, tone: "waterplain", center: { lat: 21.25, lng: 110.8 }, polygon: [{ lat: 20.18, lng: 109.65 }, { lat: 21.20, lng: 109.60 }, { lat: 22.25, lng: 110.55 }, { lat: 22.35, lng: 112.25 }, { lat: 21.55, lng: 112.45 }, { lat: 20.20, lng: 110.55 }] },
    { id: "beibu-gulf-coastal-lowlands", name: "北部湾沿海低地", tier: 3, tone: "waterplain", center: { lat: 21.75, lng: 108.65 }, polygon: [{ lat: 21.25, lng: 107.75 }, { lat: 22.20, lng: 107.95 }, { lat: 22.45, lng: 108.75 }, { lat: 22.08, lng: 109.35 }, { lat: 21.20, lng: 109.55 }, { lat: 20.95, lng: 108.65 }] },
    { id: "taipei-basin", name: "台北盆地", tier: 3, tone: "basin", center: { lat: 25.03, lng: 121.55 }, polygon: [{ lat: 24.88, lng: 121.35 }, { lat: 25.10, lng: 121.28 }, { lat: 25.24, lng: 121.52 }, { lat: 25.12, lng: 121.72 }, { lat: 24.92, lng: 121.68 }] },
    { id: "taiwan-western-plains", name: "台湾西部平原", tier: 3, tone: "waterplain", center: { lat: 23.7, lng: 120.45 }, polygon: [{ lat: 22.45, lng: 120.05 }, { lat: 23.30, lng: 120.05 }, { lat: 24.25, lng: 120.25 }, { lat: 25.08, lng: 121.08 }, { lat: 25.05, lng: 121.36 }, { lat: 24.72, lng: 121.38 }, { lat: 23.75, lng: 120.86 }, { lat: 22.55, lng: 120.55 }] },
    { id: "taiwan-mountains", name: "台湾山地", tier: 2, tone: "snow", center: { lat: 23.75, lng: 121.0 }, polygon: [{ lat: 22.15, lng: 120.55 }, { lat: 23.20, lng: 120.65 }, { lat: 24.50, lng: 121.05 }, { lat: 25.05, lng: 121.42 }, { lat: 24.25, lng: 121.50 }, { lat: 22.70, lng: 121.05 }] },
    { id: "taiwan-east-coast-valley", name: "花东纵谷-东海岸低地", tier: 3, tone: "waterplain", center: { lat: 23.35, lng: 121.35 }, polygon: [{ lat: 22.35, lng: 121.00 }, { lat: 23.20, lng: 121.25 }, { lat: 24.20, lng: 121.42 }, { lat: 24.22, lng: 121.72 }, { lat: 23.20, lng: 121.62 }, { lat: 22.45, lng: 121.30 }] },
    { id: "hainan-central-mountains", name: "海南中部山地", tier: 2, tone: "karst", center: { lat: 18.95, lng: 109.62 }, polygon: [{ lat: 18.45, lng: 109.15 }, { lat: 18.90, lng: 109.05 }, { lat: 19.35, lng: 109.45 }, { lat: 19.12, lng: 109.95 }, { lat: 18.58, lng: 110.02 }, { lat: 18.35, lng: 109.58 }] },
    { id: "hainan-coastal-lowlands", name: "海南沿海低地", tier: 3, tone: "waterplain", center: { lat: 19.1, lng: 109.8 }, polygon: [{ lat: 18.05, lng: 108.45 }, { lat: 19.15, lng: 108.45 }, { lat: 20.20, lng: 109.25 }, { lat: 20.18, lng: 110.80 }, { lat: 19.35, lng: 111.05 }, { lat: 18.05, lng: 109.75 }, { lat: 18.30, lng: 109.15 }, { lat: 18.50, lng: 109.35 }, { lat: 18.52, lng: 109.75 }, { lat: 18.78, lng: 110.05 }, { lat: 19.10, lng: 110.20 }, { lat: 19.42, lng: 110.02 }, { lat: 19.28, lng: 109.82 }, { lat: 19.00, lng: 109.70 }, { lat: 18.95, lng: 109.30 }, { lat: 18.90, lng: 108.85 }] },
  ];

  const CHINA_WATER_SYSTEMS = [
    { id: "yangtze", name: "长江", tone: "blue", path: [{ lat: 33.2, lng: 91.5 }, { lat: 31.7, lng: 97.3 }, { lat: 30.6, lng: 104.1 }, { lat: 30.6, lng: 111.3 }, { lat: 30.5, lng: 114.3 }, { lat: 31.2, lng: 118.7 }, { lat: 31.4, lng: 121.2 }] },
    { id: "yellow", name: "黄河", tone: "gold", path: [{ lat: 34.9, lng: 96.4 }, { lat: 36.1, lng: 101.8 }, { lat: 37.7, lng: 106.2 }, { lat: 40.3, lng: 111.6 }, { lat: 36.7, lng: 112.9 }, { lat: 34.8, lng: 113.6 }, { lat: 37.6, lng: 118.9 }] },
    { id: "pearl", name: "珠江", tone: "cyan", path: [{ lat: 25.5, lng: 104.4 }, { lat: 24.4, lng: 107.1 }, { lat: 23.7, lng: 110.2 }, { lat: 23.1, lng: 113.2 }, { lat: 22.6, lng: 114.2 }] },
    { id: "heilongjiang", name: "黑龙江", tone: "ice", path: [{ lat: 49.3, lng: 119.5 }, { lat: 50.1, lng: 124.1 }, { lat: 49.55, lng: 128.8 }, { lat: 47.7, lng: 132.25 }, { lat: 47.1, lng: 134.15 }] },
    { id: "lancang", name: "澜沧江", tone: "green", path: [{ lat: 33.1, lng: 94.5 }, { lat: 30.5, lng: 96.8 }, { lat: 27.6, lng: 99 }, { lat: 24.8, lng: 100.1 }, { lat: 21.7, lng: 101.3 }] },
  ];

  const CHINA_BOUNDARY = {
    id: "china-boundary-guide",
    name: "国界轮廓参考",
    path: [{ lat: 22, lng: 74 }, { lat: 31, lng: 75 }, { lat: 39, lng: 75 }, { lat: 45, lng: 82 }, { lat: 49, lng: 87 }, { lat: 48, lng: 96 }, { lat: 50, lng: 105 }, { lat: 53, lng: 115 }, { lat: 53, lng: 124 }, { lat: 49, lng: 134 }, { lat: 44, lng: 132 }, { lat: 40, lng: 124 }, { lat: 38, lng: 121 }, { lat: 33, lng: 122 }, { lat: 29, lng: 121 }, { lat: 24, lng: 118 }, { lat: 22, lng: 114 }, { lat: 21, lng: 109 }, { lat: 22, lng: 104 }, { lat: 21, lng: 101 }, { lat: 23, lng: 98 }, { lat: 27, lng: 92 }, { lat: 28, lng: 86 }, { lat: 27, lng: 80 }, { lat: 22, lng: 74 }],
  };

  const CHINA_PROVINCE_BOUNDARY_GUIDES = [
    { id: "xinjiang-gansu", path: [{ lat: 39, lng: 96 }, { lat: 42, lng: 96 }] },
    { id: "xinjiang-qinghai", path: [{ lat: 36, lng: 90 }, { lat: 39, lng: 96 }] },
    { id: "tibet-qinghai", path: [{ lat: 32, lng: 84 }, { lat: 35, lng: 96 }] },
    { id: "qinghai-gansu", path: [{ lat: 36, lng: 96 }, { lat: 39, lng: 103 }] },
    { id: "gansu-inner-mongolia", path: [{ lat: 40, lng: 100 }, { lat: 42, lng: 108 }] },
    { id: "inner-mongolia-north", path: [{ lat: 42, lng: 108 }, { lat: 44, lng: 119 }] },
    { id: "ningxia-shaanxi", path: [{ lat: 35, lng: 106 }, { lat: 39, lng: 108 }] },
    { id: "shaanxi-shanxi", path: [{ lat: 34, lng: 109 }, { lat: 39, lng: 111 }] },
    { id: "shanxi-hebei", path: [{ lat: 36, lng: 113 }, { lat: 40, lng: 115 }] },
    { id: "hebei-liaoning", path: [{ lat: 40, lng: 118 }, { lat: 42, lng: 121 }] },
    { id: "liaoning-jilin", path: [{ lat: 42, lng: 124 }, { lat: 44, lng: 126 }] },
    { id: "jilin-heilongjiang", path: [{ lat: 44, lng: 126 }, { lat: 47, lng: 129 }] },
    { id: "sichuan-tibet", path: [{ lat: 28, lng: 98 }, { lat: 32, lng: 101 }] },
    { id: "sichuan-yunnan", path: [{ lat: 27, lng: 101 }, { lat: 29, lng: 105 }] },
    { id: "sichuan-chongqing", path: [{ lat: 29, lng: 106 }, { lat: 32, lng: 108 }] },
    { id: "hubei-hunan", path: [{ lat: 29, lng: 110 }, { lat: 31, lng: 114 }] },
    { id: "jiangxi-fujian", path: [{ lat: 25, lng: 116 }, { lat: 28, lng: 118 }] },
    { id: "guangxi-guangdong", path: [{ lat: 22.5, lng: 110 }, { lat: 24, lng: 114 }] },
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toRadians(degrees) {
    return (Number(degrees) * Math.PI) / 180;
  }

  function latLngToVector3({ lat, lng, radius = DEFAULT_RADIUS }) {
    const phi = toRadians(90 - clamp(Number(lat), -90, 90));
    const theta = toRadians(Number(lng));
    return [
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.cos(theta),
    ];
  }

  function vector3ToLatLng(vector) {
    if (!Array.isArray(vector) || vector.length < 3) {
      return null;
    }
    const x = Number(vector[0]);
    const y = Number(vector[1]);
    const z = Number(vector[2]);
    const radius = Math.sqrt(x * x + y * y + z * z);
    if (!Number.isFinite(radius) || radius <= 0) {
      return null;
    }
    return {
      lat: 90 - (Math.acos(clamp(y / radius, -1, 1)) * 180) / Math.PI,
      lng: (Math.atan2(x, z) * 180) / Math.PI,
    };
  }

  function normalizeZoom(distance) {
    return clamp(Number(distance), MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE);
  }

  function createLayerVisibilityState(overrides = {}) {
    return MAP_LAYERS.reduce((state, layer) => {
      const defaultVisible = !DEFAULT_HIDDEN_LAYERS.has(layer.id);
      state[layer.id] = Object.prototype.hasOwnProperty.call(overrides, layer.id)
        ? overrides[layer.id] !== false
        : defaultVisible;
      return state;
    }, {});
  }

  function getRenderableMapLayers(layerCounts = {}) {
    return MAP_LAYERS.filter((layer) => {
      const count = layerCounts[layer.id];
      return !(Number.isFinite(count) && count <= 0);
    });
  }

  function getGroupedRenderableMapLayers(layerCounts = {}) {
    const renderableLayers = getRenderableMapLayers(layerCounts);
    const layerById = new Map(renderableLayers.map((layer) => [layer.id, layer]));
    return MAP_LAYER_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      primaryLayerIds: group.primaryLayerIds.filter((layerId) => layerById.has(layerId)),
      layers: group.layerIds.map((layerId) => layerById.get(layerId)).filter(Boolean),
    })).filter((group) => group.layers.length > 0);
  }

  function findMapLayerGroup(groupId, layerCounts = {}) {
    return getGroupedRenderableMapLayers(layerCounts).find((group) => group.id === groupId) || null;
  }

  function getMapLayerGroupState(layerState, groupId, layerCounts = {}) {
    const group = findMapLayerGroup(groupId, layerCounts);
    if (!group) {
      return { active: false, mixed: false, visibleCount: 0, totalCount: 0 };
    }
    const current = layerState || createLayerVisibilityState();
    const visibleCount = group.layers.filter((layer) => current[layer.id] !== false).length;
    return {
      active: visibleCount > 0,
      mixed: visibleCount > 0 && visibleCount < group.layers.length,
      visibleCount,
      totalCount: group.layers.length,
    };
  }

  function toggleMapLayer(layerState, layerId) {
    if (!MAP_LAYERS.some((layer) => layer.id === layerId)) {
      return layerState;
    }
    const current = layerState || createLayerVisibilityState();
    return {
      ...current,
      [layerId]: current[layerId] === false,
    };
  }

  function toggleMapLayerGroup(layerState, groupId, layerCounts = {}) {
    const group = findMapLayerGroup(groupId, layerCounts);
    if (!group) {
      return layerState;
    }
    const current = layerState || createLayerVisibilityState();
    const groupState = getMapLayerGroupState(current, groupId, layerCounts);
    const next = { ...current };
    if (groupState.active) {
      group.layers.forEach((layer) => {
        next[layer.id] = false;
      });
      return next;
    }
    const primaryIds = group.primaryLayerIds.length ? group.primaryLayerIds : group.layers.map((layer) => layer.id);
    group.layers.forEach((layer) => {
      next[layer.id] = primaryIds.includes(layer.id);
    });
    return next;
  }

  function getWaterSystemLayerId(river) {
    const rank = typeof river === "string" ? river : river && river.rank;
    if (rank !== "tributary") {
      return "water";
    }
    const source = river && typeof river === "object" ? String(river.source || "") : "";
    const scaleRank = river && typeof river === "object" ? Number(river.scaleRank) : 0;
    const isProjectAuthored = source.includes("project-authored");
    return !isProjectAuthored && Number.isFinite(scaleRank) && scaleRank > 6
      ? "waterMinorTributaries"
      : "waterTributaries";
  }

  function getTerrainDetailPatchItems(patchLayer) {
    const patches = Array.isArray(patchLayer) ? patchLayer : patchLayer && patchLayer.patches;
    return Array.isArray(patches) ? patches.filter((patch) => patch && patch.id) : [];
  }

  function createDetailPatchVisibilityState(patchLayer, overrides = {}) {
    return getTerrainDetailPatchItems(patchLayer).reduce((state, patch) => {
      state[patch.id] = overrides[patch.id] !== false;
      return state;
    }, {});
  }

  function toggleDetailPatchVisibility(patchState, patchLayer, patchId) {
    if (!getTerrainDetailPatchItems(patchLayer).some((patch) => patch.id === patchId)) {
      return patchState;
    }
    const current = patchState || createDetailPatchVisibilityState(patchLayer);
    return {
      ...current,
      [patchId]: current[patchId] === false,
    };
  }

  function getTerrainTraceGuideItems(traceLayer) {
    const traces = Array.isArray(traceLayer) ? traceLayer : traceLayer && traceLayer.traces;
    return Array.isArray(traces) ? traces.filter((trace) => trace && trace.id) : [];
  }

  function createTerrainTraceVisibilityState(traceLayer, overrides = {}) {
    return getTerrainTraceGuideItems(traceLayer).reduce((state, trace) => {
      state[trace.id] = overrides[trace.id] !== false;
      return state;
    }, {});
  }

  function toggleTerrainTraceVisibility(traceState, traceLayer, traceId) {
    if (!getTerrainTraceGuideItems(traceLayer).some((trace) => trace.id === traceId)) {
      return traceState;
    }
    const current = traceState || createTerrainTraceVisibilityState(traceLayer);
    return {
      ...current,
      [traceId]: current[traceId] === false,
    };
  }

  function getTerrainPatchSuggestionItems(suggestionLayer) {
    const patches = Array.isArray(suggestionLayer) ? suggestionLayer : suggestionLayer && suggestionLayer.patches;
    return Array.isArray(patches) ? patches.filter((patch) => patch && patch.id) : [];
  }

  function findTerrainPatchSuggestion(suggestionLayer, patchId) {
    const id = patchId ? String(patchId) : "";
    return getTerrainPatchSuggestionItems(suggestionLayer).find((patch) => patch.id === id) || null;
  }

  function getTerrainPatchSourceTileMetadata(patch) {
    if (!patch) return {};
    const metadata = {};
    if (patch.sourceTileId) {
      metadata.sourceTileId = String(patch.sourceTileId);
    }
    if (patch.sourceTileLabel) {
      metadata.sourceTileLabel = String(patch.sourceTileLabel);
    }
    if (patch.sourceTileBounds && typeof patch.sourceTileBounds === "object") {
      metadata.sourceTileBounds = { ...patch.sourceTileBounds };
    }
    if (patch.sourceTileDataset) {
      metadata.sourceTileDataset = String(patch.sourceTileDataset);
    }
    const reliefMeters = Number(patch.sourceTileReliefMeters);
    if (Number.isFinite(reliefMeters)) {
      metadata.sourceTileReliefMeters = reliefMeters;
    }
    return metadata;
  }

  function promoteTerrainPatchSuggestions(suggestionLayer, patchIds, options = {}) {
    const ids = Array.isArray(patchIds) ? patchIds.map(String) : [];
    const labelPrefix = options.labelPrefix ? String(options.labelPrefix) : "";
    const patches = ids
      .map((patchId) => findTerrainPatchSuggestion(suggestionLayer, patchId))
      .filter(Boolean)
      .map((patch) => promoteTerrainPatchSuggestion(patch, labelPrefix))
      .filter(Boolean);

    return {
      id: options.id || "approved-terrain-detail-patches",
      type: "terrain-detail-patches",
      units: "meters",
      note: "Reviewed terrain detail patches promoted from trace-derived patch suggestions.",
      patches,
    };
  }

  function promoteTerrainPatchSuggestion(patch, labelPrefix = "") {
    const kind = patch && patch.kind ? String(patch.kind) : "radial";
    const deltaMeters = Number(patch && patch.deltaMeters);
    const base = {
      id: patch.id,
      label: `${labelPrefix ? `${labelPrefix} ` : ""}${patch.label || patch.id}`,
      kind,
      deltaMeters,
      sourceSuggestionId: patch.id,
      sourceTraceId: patch.sourceTraceId || "",
      sourceTraceKind: patch.sourceTraceKind || "",
      ...getTerrainPatchSourceTileMetadata(patch),
      reviewStatus: "approved",
    };
    if (kind === "line-band") {
      const points = normalizePatchPathPoints(patch.points || patch.path);
      const widthDegrees = Number(patch.widthDegrees);
      if (points.length < 2 || !Number.isFinite(widthDegrees) || widthDegrees <= 0 || !Number.isFinite(deltaMeters)) {
        return null;
      }
      return {
        ...base,
        points,
        widthDegrees,
      };
    }
    if (kind === "polygon-mask") {
      const points = normalizePatchPathPoints(patch.points || patch.polygon || patch.path);
      if (points.length < 3 || !Number.isFinite(deltaMeters)) {
        return null;
      }
      const promoted = {
        ...base,
        points,
      };
      const edgeFeatherDegrees = Number(patch.edgeFeatherDegrees);
      if (Number.isFinite(edgeFeatherDegrees) && edgeFeatherDegrees > 0) {
        promoted.edgeFeatherDegrees = edgeFeatherDegrees;
      }
      return promoted;
    }
    const center = {
      lat: Number(patch.center && patch.center.lat),
      lng: Number(patch.center && patch.center.lng),
    };
    const radiusDegrees = Number(patch.radiusDegrees);
    if (
      !Number.isFinite(center.lat) ||
      !Number.isFinite(center.lng) ||
      !Number.isFinite(radiusDegrees) ||
      radiusDegrees <= 0 ||
      !Number.isFinite(deltaMeters)
    ) {
      return null;
    }
    return {
      ...base,
      center,
      radiusDegrees,
    };
  }

  function summarizeTerrainPatchSuggestionBundle(suggestionLayer, patchIds) {
    const seen = new Set();
    const ids = Array.isArray(patchIds)
      ? patchIds
        .map(String)
        .filter((id) => {
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
      : [];
    const patches = ids
      .map((patchId) => findTerrainPatchSuggestion(suggestionLayer, patchId))
      .filter(isBundleableTerrainPatchSuggestion);
    const validIds = patches.map((patch) => patch.id);
    const count = patches.length;
    const centers = patches.map(terrainPatchSuggestionFocusPoint).filter(Boolean);
    const totals = patches.reduce((sum, patch) => ({
      radiusDegrees: sum.radiusDegrees + terrainPatchSuggestionRangeDegrees(patch),
      deltaMeters: sum.deltaMeters + Number(patch.deltaMeters),
      lifts: sum.lifts + (Number(patch.deltaMeters) > 0 ? 1 : 0),
      depressions: sum.depressions + (Number(patch.deltaMeters) < 0 ? 1 : 0),
    }), { radiusDegrees: 0, deltaMeters: 0, lifts: 0, depressions: 0 });
    const centerTotal = centers.reduce((sum, center) => ({
      lat: sum.lat + center.lat,
      lng: sum.lng + center.lng,
    }), { lat: 0, lng: 0 });

    return {
      ids: validIds,
      patches,
      count,
      center: centers.length ? { lat: centerTotal.lat / centers.length, lng: centerTotal.lng / centers.length } : null,
      averageRadiusDegrees: count ? totals.radiusDegrees / count : 0,
      totalDeltaMeters: totals.deltaMeters,
      lifts: totals.lifts,
      depressions: totals.depressions,
      promoteCommand: validIds.length
        ? `node scripts/promote-trace-patch-suggestions.js ${validIds.join(" ")}`
        : "node scripts/promote-trace-patch-suggestions.js",
    };
  }

  function terrainPatchSuggestionFocusPoint(patch) {
    if (!patch) return null;
    const center = patch.center;
    if (center && Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))) {
      return { lat: Number(center.lat), lng: Number(center.lng) };
    }
    return getTerrainTraceCenter({ points: patch.points || patch.path });
  }

  function terrainPatchSuggestionRangeDegrees(patch) {
    const radiusDegrees = Number(patch && patch.radiusDegrees);
    if (Number.isFinite(radiusDegrees)) return radiusDegrees;
    const widthDegrees = Number(patch && patch.widthDegrees);
    return Number.isFinite(widthDegrees) ? widthDegrees : 0;
  }

  function isBundleableTerrainPatchSuggestion(patch) {
    if (!patch || !Number.isFinite(Number(patch.deltaMeters))) {
      return false;
    }
    if (patch.kind === "line-band") {
      return normalizePatchPathPoints(patch.points || patch.path).length >= 2 &&
        Number.isFinite(Number(patch.widthDegrees)) &&
        Number(patch.widthDegrees) > 0;
    }
    return Boolean(
      patch.center &&
      Number.isFinite(Number(patch.center.lat)) &&
      Number.isFinite(Number(patch.center.lng)) &&
      Number.isFinite(Number(patch.radiusDegrees)) &&
      Number(patch.radiusDegrees) > 0
    );
  }

  function groupTerrainPatchSuggestionsByTrace(suggestionLayer) {
    const groups = new Map();
    getTerrainPatchSuggestionItems(suggestionLayer).forEach((patch) => {
      const groupId = patch.sourceTraceId ? String(patch.sourceTraceId) : "unassigned";
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          label: patch.sourceTraceLabel || groupId,
          sourceTraceId: groupId,
          sourceTraceKind: patch.sourceTraceKind || "ridge",
          sourceTileId: patch.sourceTileId || "",
          sourceTileLabel: patch.sourceTileLabel || "",
          sourceTileDataset: patch.sourceTileDataset || "",
          reviewStatus: patch.reviewStatus || "draft",
          reviewStatuses: [],
          patches: [],
          total: 0,
          lifts: 0,
          depressions: 0,
          radialCount: 0,
          lineBandCount: 0,
          polygonMaskCount: 0,
        });
      }
      const group = groups.get(groupId);
      const deltaMeters = Number(patch.deltaMeters);
      if (!group.sourceTileId && patch.sourceTileId) {
        group.sourceTileId = patch.sourceTileId;
      }
      if (!group.sourceTileLabel && patch.sourceTileLabel) {
        group.sourceTileLabel = patch.sourceTileLabel;
      }
      if (!group.sourceTileDataset && patch.sourceTileDataset) {
        group.sourceTileDataset = patch.sourceTileDataset;
      }
      const reviewStatus = patch.reviewStatus || "draft";
      if (!group.reviewStatuses.includes(reviewStatus)) {
        group.reviewStatuses.push(reviewStatus);
        group.reviewStatus = group.reviewStatuses.length > 1 ? "mixed" : reviewStatus;
      }
      if (patch.kind === "polygon-mask") {
        group.polygonMaskCount += 1;
      } else if (patch.kind === "line-band") {
        group.lineBandCount += 1;
      } else {
        group.radialCount += 1;
      }
      group.patches.push(patch);
      group.total += 1;
      if (deltaMeters > 0) group.lifts += 1;
      if (deltaMeters < 0) group.depressions += 1;
    });
    return Array.from(groups.values());
  }

  function createTerrainPatchSuggestionGroupVisibilityState(suggestionLayer, overrides = {}) {
    return groupTerrainPatchSuggestionsByTrace(suggestionLayer).reduce((state, group) => {
      state[group.id] = overrides[group.id] !== false;
      return state;
    }, {});
  }

  function toggleTerrainPatchSuggestionGroupVisibility(suggestionState, suggestionLayer, groupId) {
    if (!groupTerrainPatchSuggestionsByTrace(suggestionLayer).some((group) => group.id === groupId)) {
      return suggestionState;
    }
    const current = suggestionState || createTerrainPatchSuggestionGroupVisibilityState(suggestionLayer);
    return {
      ...current,
      [groupId]: current[groupId] === false,
    };
  }

  function buildTerrainTracePath(trace, region = CHINA_REGION) {
    const points = trace && Array.isArray(trace.points) ? trace.points : [];
    const path = points
      .map((point) => ({ lat: Number(point && point.lat), lng: Number(point && point.lng) }))
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng) && isInRegion(point, region));
    return path.length >= 2 ? path : [];
  }

  function getTerrainTraceCenter(trace, region = CHINA_REGION) {
    const path = buildTerrainTracePath(trace, region);
    if (!path.length) return null;
    const total = path.reduce((sum, point) => ({
      lat: sum.lat + point.lat,
      lng: sum.lng + point.lng,
    }), { lat: 0, lng: 0 });
    return {
      lat: Number((total.lat / path.length).toFixed(6)),
      lng: Number((total.lng / path.length).toFixed(6)),
    };
  }

  function createManualTerrainTraceDraft(options = {}) {
    return {
      id: options.id ? String(options.id) : "manual-terrain-trace-draft",
      label: options.label ? String(options.label) : "Manual terrain trace",
      kind: options.kind ? String(options.kind) : "ridge",
      points: [],
    };
  }

  function addManualTerrainTracePoint(draft, point, region = CHINA_REGION) {
    const current = draft || createManualTerrainTraceDraft();
    const nextPoint = normalizeManualTracePoint(point, region);
    const points = Array.isArray(current.points) ? current.points : [];
    if (!nextPoint || !isManualTracePointInsideSourceTile(current, nextPoint)) {
      return { ...current, points: [...points] };
    }
    return {
      ...current,
      closed: false,
      points: [...points, nextPoint],
    };
  }

  function closeManualTerrainTraceDraft(draft, region = CHINA_REGION) {
    const current = draft || createManualTerrainTraceDraft();
    const points = Array.isArray(current.points)
      ? current.points.map((point) => normalizeManualTracePoint(point, region)).filter(Boolean)
      : [];
    if (points.length < 3) {
      return { ...current, closed: false, points };
    }
    const first = points[0];
    const last = points[points.length - 1];
    const alreadyClosed = first.lat === last.lat && first.lng === last.lng;
    return {
      ...current,
      closed: true,
      points: alreadyClosed ? points : [...points, { ...first }],
    };
  }

  function updateManualTerrainTracePointAt(draft, index, point, region = CHINA_REGION) {
    const current = draft || createManualTerrainTraceDraft();
    const points = Array.isArray(current.points) ? current.points : [];
    const pointIndex = Number(index);
    const nextPoint = normalizeManualTracePoint(point, region);
    if (!Number.isInteger(pointIndex) || pointIndex < 0 || pointIndex >= points.length || !nextPoint || !isManualTracePointInsideSourceTile(current, nextPoint)) {
      return { ...current, points: [...points] };
    }
    return {
      ...current,
      closed: false,
      points: points.map((existingPoint, existingIndex) => (existingIndex === pointIndex ? nextPoint : { ...existingPoint })),
    };
  }

  function removeManualTerrainTracePointAt(draft, index) {
    const current = draft || createManualTerrainTraceDraft();
    const points = Array.isArray(current.points) ? current.points : [];
    const pointIndex = Number(index);
    if (!Number.isInteger(pointIndex) || pointIndex < 0 || pointIndex >= points.length) {
      return { ...current, points: [...points] };
    }
    return {
      ...current,
      closed: false,
      points: points.filter((_, existingIndex) => existingIndex !== pointIndex),
    };
  }

  function undoManualTerrainTracePoint(draft) {
    const current = draft || createManualTerrainTraceDraft();
    const points = Array.isArray(current.points) ? current.points : [];
    return {
      ...current,
      closed: false,
      points: points.slice(0, -1),
    };
  }

  function reverseManualTerrainTraceDraft(draft) {
    const current = draft || createManualTerrainTraceDraft();
    const points = Array.isArray(current.points) ? current.points : [];
    return {
      ...current,
      closed: false,
      points: [...points].reverse(),
    };
  }

  function simplifyManualTerrainTraceDraft(draft, options = {}) {
    const current = draft || createManualTerrainTraceDraft();
    const points = Array.isArray(current.points) ? current.points : [];
    if (points.length <= 2) {
      return { ...current, closed: false, points: [...points] };
    }
    const stride = Math.max(2, Math.round(Number(options.stride) || 2));
    const simplified = points.filter((point, index) => index === 0 || index === points.length - 1 || index % stride === 0);
    const lastPoint = points[points.length - 1];
    if (simplified[simplified.length - 1] !== lastPoint) {
      simplified.push(lastPoint);
    }
    return {
      ...current,
      closed: false,
      points: simplified,
    };
  }

  function smoothManualTerrainTraceDraft(draft) {
    const current = draft || createManualTerrainTraceDraft();
    const points = Array.isArray(current.points) ? current.points : [];
    if (points.length <= 2) {
      return { ...current, closed: false, points: [...points], smoothedPointCount: 0 };
    }
    const smoothed = points.map((point, index) => {
      if (index === 0 || index === points.length - 1) {
        return { ...point };
      }
      const previous = points[index - 1];
      const next = points[index + 1];
      return {
        lat: Number(((Number(previous.lat) + Number(point.lat) + Number(next.lat)) / 3).toFixed(4)),
        lng: Number(((Number(previous.lng) + Number(point.lng) + Number(next.lng)) / 3).toFixed(4)),
      };
    });
    return {
      ...current,
      closed: false,
      points: smoothed,
      smoothedPointCount: points.length - 2,
    };
  }

  function clearManualTerrainTraceDraft(draft) {
    const current = draft || createManualTerrainTraceDraft();
    return {
      ...current,
      closed: false,
      points: [],
    };
  }

  function normalizeManualTracePoint(point, region = CHINA_REGION) {
    if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) {
      return null;
    }
    const normalized = {
      lat: Number(Number(point.lat).toFixed(4)),
      lng: Number(Number(point.lng).toFixed(4)),
    };
    return isInRegion(normalized, region) ? normalized : null;
  }

  function isManualTracePointInsideSourceTile(draft, point) {
    const bounds = draft && draft.sourceTileBounds;
    if (!bounds) {
      return true;
    }
    return isPointInsideBounds(point, bounds);
  }

  function buildTerrainTracePatchSuggestions(trace, options = {}) {
    const path = buildTerrainTracePath(trace);
    const sourceTraceId = trace && trace.id ? String(trace.id) : "trace";
    const sourceTraceKind = trace && trace.kind ? String(trace.kind) : "ridge";
    const sourceLabel = trace && trace.label ? String(trace.label) : sourceTraceId;
    const radiusDegrees = Number.isFinite(Number(options.radiusDegrees))
      ? Number(options.radiusDegrees)
      : defaultTracePatchRadius(sourceTraceKind);
    const deltaMeters = Number.isFinite(Number(options.deltaMeters))
      ? Number(options.deltaMeters)
      : defaultTracePatchDelta(sourceTraceKind);
    const widthDegrees = Number.isFinite(Number(options.widthDegrees))
      ? Number(options.widthDegrees)
      : defaultTracePatchWidth(sourceTraceKind);
    const polygonEdgeFeatherDegrees = Number.isFinite(Number(options.polygonEdgeFeatherDegrees))
      ? Number(options.polygonEdgeFeatherDegrees)
      : defaultTracePolygonMaskFeather(sourceTraceKind);
    const polygonDeltaMeters = Number.isFinite(Number(options.polygonDeltaMeters))
      ? Number(options.polygonDeltaMeters)
      : defaultTracePolygonMaskDelta(sourceTraceKind);
    const suggestionLayer = {
      id: `${sourceTraceId}-sculpt-suggestions`,
      type: "terrain-detail-patch-suggestions",
      sourceTraceId,
      sourceTraceKind,
      patches: [],
    };
    if (path.length < 2 || radiusDegrees <= 0 || !Number.isFinite(deltaMeters)) {
      return suggestionLayer;
    }
    const polygonPoints = options.includePolygonMask ? closedTracePolygonPoints(path, options.polygonClosureDegrees) : [];
    const suggestionPath = polygonPoints.length >= 3 ? polygonPoints : path;
    suggestionLayer.patches = suggestionPath.map((point, index) => ({
      id: `${sourceTraceId}-sculpt-${String(index + 1).padStart(2, "0")}`,
      label: `${sourceLabel} ${index + 1}`,
      kind: "radial",
      sourceTraceId,
      sourceTraceKind,
      center: {
        lat: roundCoordinate(point.lat),
        lng: roundCoordinate(point.lng),
      },
      radiusDegrees,
      deltaMeters,
    }));
    if (options.includeLineBand && widthDegrees > 0) {
      suggestionLayer.patches.push({
        id: `${sourceTraceId}-sculpt-band`,
        label: `${sourceLabel} band`,
        kind: "line-band",
        sourceTraceId,
        sourceTraceKind,
        points: suggestionPath.map((point) => ({
          lat: roundCoordinate(point.lat),
          lng: roundCoordinate(point.lng),
        })),
        widthDegrees,
        deltaMeters,
      });
    }
    if (options.includePolygonMask && polygonEdgeFeatherDegrees > 0 && Number.isFinite(polygonDeltaMeters)) {
      if (polygonPoints.length >= 3) {
        suggestionLayer.patches.push({
          id: `${sourceTraceId}-sculpt-mask`,
          label: `${sourceLabel} mask`,
          kind: "polygon-mask",
          sourceTraceId,
          sourceTraceKind,
          points: polygonPoints.map((point) => ({
            lat: roundCoordinate(point.lat),
            lng: roundCoordinate(point.lng),
          })),
          edgeFeatherDegrees: polygonEdgeFeatherDegrees,
          deltaMeters: polygonDeltaMeters,
        });
      }
    }
    return suggestionLayer;
  }

  function closedTracePolygonPoints(path, closureDegrees) {
    const points = normalizePatchPathPoints(path);
    if (points.length < 4) {
      return [];
    }
    const threshold = Number.isFinite(Number(closureDegrees)) ? Number(closureDegrees) : 0.18;
    const first = points[0];
    const last = points[points.length - 1];
    const closureDistance = Math.sqrt((first.lat - last.lat) ** 2 + (first.lng - last.lng) ** 2);
    if (!Number.isFinite(closureDistance) || closureDistance > threshold) {
      return [];
    }
    const polygonPoints = points.slice(0, -1);
    return polygonPoints.length >= 3 ? polygonPoints : [];
  }

  function defaultTracePolygonMaskFeather(kind) {
    if (kind === "valley") return 0.1;
    if (kind === "basin-edge") return 0.12;
    return 0.14;
  }

  function defaultTracePolygonMaskDelta(kind) {
    if (kind === "valley") return -180;
    if (kind === "basin-edge") return -220;
    return 260;
  }

  function defaultTracePatchWidth(kind) {
    if (kind === "valley") return 0.45;
    if (kind === "basin-edge") return 0.55;
    return 0.5;
  }

  function defaultTracePatchRadius(kind) {
    if (kind === "valley") return 0.75;
    if (kind === "basin-edge") return 0.95;
    return 0.85;
  }

  function defaultTracePatchDelta(kind) {
    if (kind === "valley") return -260;
    if (kind === "basin-edge") return 260;
    return 420;
  }

  function isInRegion(point, region = CHINA_REGION) {
    const bounds = region.bounds;
    return Number(point.lat) >= bounds.minLat && Number(point.lat) <= bounds.maxLat && Number(point.lng) >= bounds.minLng && Number(point.lng) <= bounds.maxLng;
  }

  function regionProgress(point, region = CHINA_REGION) {
    const bounds = region.bounds;
    return {
      x: (Number(point.lng) - bounds.minLng) / (bounds.maxLng - bounds.minLng),
      y: (Number(point.lat) - bounds.minLat) / (bounds.maxLat - bounds.minLat),
    };
  }

  function normalizeMajorCityIds(majorCityIds) {
    if (majorCityIds instanceof Set) {
      return majorCityIds;
    }
    if (Array.isArray(majorCityIds)) {
      return new Set(majorCityIds);
    }
    return new Set();
  }

  function isPointInsideBounds(point, bounds, paddingDegrees = 0) {
    if (!point || !bounds) {
      return false;
    }
    const lat = Number(point.lat);
    const lng = Number(point.lng);
    const padding = Number.isFinite(Number(paddingDegrees)) ? Number(paddingDegrees) : 0;
    return Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= Number(bounds.minLat) - padding &&
      lat <= Number(bounds.maxLat) + padding &&
      lng >= Number(bounds.minLng) - padding &&
      lng <= Number(bounds.maxLng) + padding;
  }

  function cityObservationImportance(city, cities = CHINA_TERRAIN_CITIES, majorCityIds = []) {
    if (!city) {
      return 0;
    }
    const majorIds = normalizeMajorCityIds(majorCityIds);
    if (majorIds.has(city.id)) {
      return 3;
    }
    if (city.terrainBlockId) {
      const blockAnchor = (Array.isArray(cities) ? cities : []).find((item) => item && item.terrainBlockId === city.terrainBlockId);
      if (blockAnchor && blockAnchor.id === city.id) {
        return 2;
      }
    }
    return 1;
  }

  function shouldShowCityForObservationDistance(city, options = {}) {
    const detailLevel = options.detailLevel || "far";
    const isLocalTerrainCity = Boolean(options.isLocalTerrainCity);
    const isSelectedTerrainCity = Boolean(options.isSelectedTerrainCity);
    if (!city) {
      return false;
    }
    if (isSelectedTerrainCity || isLocalTerrainCity || detailLevel === "near") {
      return true;
    }
    const importance = cityObservationImportance(city, options.cities, options.majorCityIds);
    if (detailLevel === "mid") {
      return importance >= 2;
    }
    return importance >= 3;
  }

  function planCityObservationVisibility(cities, options = {}) {
    const items = Array.isArray(cities) ? cities : [];
    const detailLevel = options.detailLevel || "far";
    const bounds = options.selectedTerrainTileBounds || null;
    const selectedCityId = options.selectedCityId || null;
    const tilePaddingDegrees = Number.isFinite(Number(options.tilePaddingDegrees)) ? Number(options.tilePaddingDegrees) : 0;
    const visibleIds = [];
    let hiddenByTileFocusCount = 0;
    const entries = items.map((city) => {
      const isLocalTerrainCity = isPointInsideBounds(city, bounds, tilePaddingDegrees);
      const isSelectedTerrainCity = selectedCityId === city.id && city.kind === "prefecture";
      const hiddenByTileFocus = Boolean(bounds && detailLevel === "near" && !isLocalTerrainCity && !isSelectedTerrainCity);
      const visible = !hiddenByTileFocus && shouldShowCityForObservationDistance(city, {
        detailLevel,
        isLocalTerrainCity,
        isSelectedTerrainCity,
        cities: items,
        majorCityIds: options.majorCityIds,
      });
      if (hiddenByTileFocus) {
        hiddenByTileFocusCount += 1;
      }
      if (visible) {
        visibleIds.push(city.id);
      }
      return {
        city,
        cityId: city && city.id,
        visible,
        detailLevel,
        isLocalTerrainCity,
        isSelectedTerrainCity,
        hiddenByTileFocus,
        importance: cityObservationImportance(city, items, options.majorCityIds),
      };
    });
    return {
      detailLevel,
      entries,
      visibleIds,
      visibleCount: visibleIds.length,
      hiddenByTileFocusCount,
    };
  }

  function estimateChinaElevation(lat, lng) {
    const west = clamp((105 - Number(lng)) / 32, 0, 1);
    const tibet = Math.exp(-((Number(lat) - 31) ** 2) / 105 - ((Number(lng) - 89) ** 2) / 150);
    const tianshan = Math.exp(-((Number(lat) - 43) ** 2) / 24 - ((Number(lng) - 84) ** 2) / 110);
    const yunnan = Math.exp(-((Number(lat) - 25) ** 2) / 32 - ((Number(lng) - 101) ** 2) / 70);
    const basin = Math.exp(-((Number(lat) - 30.5) ** 2) / 20 - ((Number(lng) - 104.2) ** 2) / 38);
    const plains = clamp((Number(lng) - 111) / 22, 0, 1) * clamp((38 - Number(lat)) / 15, 0, 1);
    return clamp(0.06 + west * 0.35 + tibet * 0.62 + tianshan * 0.36 + yunnan * 0.28 - basin * 0.16 - plains * 0.08, 0.025, 0.78);
  }

  function sampleTerrainGridMeters(grid, lat, lng) {
    if (!grid || !Array.isArray(grid.latitudes) || !Array.isArray(grid.longitudes) || !Array.isArray(grid.elevationsMeters)) {
      return null;
    }
    const latitudes = grid.latitudes.map(Number);
    const longitudes = grid.longitudes.map(Number);
    const rows = grid.elevationsMeters;
    const targetLat = Number(lat);
    const targetLng = Number(lng);
    if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng) || latitudes.length < 2 || longitudes.length < 2) {
      return null;
    }
    if (targetLat < latitudes[0] || targetLat > latitudes[latitudes.length - 1] || targetLng < longitudes[0] || targetLng > longitudes[longitudes.length - 1]) {
      return null;
    }

    const latIndex = findGridLowerIndex(latitudes, targetLat);
    const lngIndex = findGridLowerIndex(longitudes, targetLng);
    if (latIndex === null || lngIndex === null) {
      return null;
    }

    const lat0 = latitudes[latIndex];
    const lat1 = latitudes[latIndex + 1];
    const lng0 = longitudes[lngIndex];
    const lng1 = longitudes[lngIndex + 1];
    const q00 = Number(rows[latIndex] && rows[latIndex][lngIndex]);
    const q01 = Number(rows[latIndex] && rows[latIndex][lngIndex + 1]);
    const q10 = Number(rows[latIndex + 1] && rows[latIndex + 1][lngIndex]);
    const q11 = Number(rows[latIndex + 1] && rows[latIndex + 1][lngIndex + 1]);
    if (![q00, q01, q10, q11].every(Number.isFinite)) {
      return null;
    }

    const tx = lng1 === lng0 ? 0 : (targetLng - lng0) / (lng1 - lng0);
    const ty = lat1 === lat0 ? 0 : (targetLat - lat0) / (lat1 - lat0);
    const west = q00 + (q10 - q00) * ty;
    const east = q01 + (q11 - q01) * ty;
    return west + (east - west) * tx;
  }

  function sampleTerrainTileMeters(tileLayer, lat, lng) {
    const tiles = Array.isArray(tileLayer && tileLayer.tiles) ? tileLayer.tiles : [];
    const candidates = tiles
      .map((tile) => {
        const meters = sampleTerrainGridMeters(tile, lat, lng);
        if (!Number.isFinite(meters)) {
          return null;
        }
        return {
          tile,
          meters,
          resolution: terrainGridResolutionScore(tile),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.resolution - a.resolution);

    return candidates.length ? candidates[0].meters : null;
  }

  function summarizeTerrainTileAnalysis(tile, options = {}) {
    const rows = tile && Array.isArray(tile.elevationsMeters) ? tile.elevationsMeters : [];
    const values = rows
      .flat()
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const empty = {
      tileId: tile && tile.id ? String(tile.id) : "",
      sampleCount: 0,
      cellCount: 0,
      minMeters: 0,
      maxMeters: 0,
      averageMeters: 0,
      reliefMeters: 0,
      maxCellReliefMeters: 0,
      averageCellReliefMeters: 0,
      steepCellCount: 0,
      steepCellRatio: 0,
      reliefClass: "unknown",
      traceRecommendation: "inspect",
      traceWorkload: "none",
    };
    if (!values.length) {
      return empty;
    }

    const steepCellReliefMeters = Number.isFinite(Number(options.steepCellReliefMeters))
      ? Number(options.steepCellReliefMeters)
      : 450;
    const minMeters = Math.min(...values);
    const maxMeters = Math.max(...values);
    const cellReliefs = [];
    for (let y = 0; y < rows.length - 1; y += 1) {
      const row = rows[y] || [];
      const nextRow = rows[y + 1] || [];
      const width = Math.min(row.length, nextRow.length) - 1;
      for (let x = 0; x < width; x += 1) {
        const corners = [
          Number(row[x]),
          Number(row[x + 1]),
          Number(nextRow[x]),
          Number(nextRow[x + 1]),
        ].filter((value) => Number.isFinite(value));
        if (corners.length !== 4) continue;
        cellReliefs.push(Math.max(...corners) - Math.min(...corners));
      }
    }
    const maxCellReliefMeters = cellReliefs.length ? Math.max(...cellReliefs) : 0;
    const averageCellReliefMeters = cellReliefs.length
      ? cellReliefs.reduce((sum, value) => sum + value, 0) / cellReliefs.length
      : 0;
    const steepCellCount = cellReliefs.filter((value) => value >= steepCellReliefMeters).length;
    const steepRatio = cellReliefs.length ? steepCellCount / cellReliefs.length : 0;
    const reliefMeters = maxMeters - minMeters;
    const reliefClass = reliefMeters >= 1500 || maxCellReliefMeters >= 900 || steepRatio >= 0.25
      ? "rugged"
      : reliefMeters >= 650 || averageCellReliefMeters >= 200
        ? "rolling"
        : "gentle";
    const traceRecommendation = reliefClass === "rugged"
      ? "ridge-valley"
      : reliefClass === "rolling"
        ? "basin-edge"
        : "water-boundary";
    const traceWorkload = reliefClass === "rugged" || steepRatio >= 0.25
      ? "dense"
      : reliefClass === "rolling" || steepRatio >= 0.08
        ? "moderate"
        : "light";

    return {
      tileId: empty.tileId,
      sampleCount: values.length,
      cellCount: cellReliefs.length,
      minMeters,
      maxMeters,
      averageMeters: values.reduce((sum, value) => sum + value, 0) / values.length,
      reliefMeters,
      maxCellReliefMeters,
      averageCellReliefMeters,
      steepCellCount,
      steepCellRatio: steepRatio,
      reliefClass,
      traceRecommendation,
      traceWorkload,
    };
  }

  function summarizeTerrainTileTraceAid(tile, options = {}) {
    const analysis = summarizeTerrainTileAnalysis(tile);
    const contourSegments = Math.max(0, Math.round(Number(options.contourSegments) || 0));
    const boundarySegments = Math.max(0, Math.round(Number(options.boundarySegments) || 0));
    const waterSegments = Math.max(0, Math.round(Number(options.waterSegments) || 0));
    const cityCount = Math.max(0, Math.round(Number(options.cityCount) || 0));
    const traceGuides = Array.isArray(options.traceGuides) ? options.traceGuides : [];
    const recommendedTraceGuideCount = Math.max(0, Math.round(Number(options.recommendedTraceGuideCount) || 0));
    const guideKinds = Array.from(new Set(traceGuides
      .map((guide) => guide && guide.kind)
      .filter(Boolean)));
    const guidePointCount = traceGuides.reduce((sum, guide) => (
      sum + (Array.isArray(guide && guide.points) ? guide.points.length : 0)
    ), 0);
    const contourDensityPerCell = analysis.cellCount
      ? Number((contourSegments / analysis.cellCount).toFixed(2))
      : 0;
    const referenceLayerCount = [
      contourSegments > 0,
      boundarySegments > 0,
      waterSegments > 0,
      cityCount > 0,
      traceGuides.length > 0,
    ].filter(Boolean).length;
    const traceReadiness = analysis.sampleCount === 0
      ? "missing-dem"
      : traceGuides.length === 0
        ? "needs-guides"
        : referenceLayerCount >= 3 && contourDensityPerCell > 0
          ? "ready"
          : "needs-detail";
    const detailPriority = analysis.traceWorkload === "dense" || contourDensityPerCell >= 2 || recommendedTraceGuideCount >= 2
      ? "high"
      : analysis.traceWorkload === "moderate" || referenceLayerCount >= 3
        ? "medium"
        : "low";

    return {
      tileId: analysis.tileId,
      traceReadiness,
      detailPriority,
      contourDensityPerCell,
      referenceLayerCount,
      guidePointCount,
      guideKinds,
      recommendedTraceGuideCount,
    };
  }

  function buildTerrainTileTraceGuides(tile, options = {}) {
    const latitudes = tile && Array.isArray(tile.latitudes) ? tile.latitudes.map(Number) : [];
    const longitudes = tile && Array.isArray(tile.longitudes) ? tile.longitudes.map(Number) : [];
    const rows = tile && Array.isArray(tile.elevationsMeters) ? tile.elevationsMeters : [];
    const maxGuidePoints = Number.isFinite(Number(options.maxGuidePoints))
      ? Math.max(2, Math.round(Number(options.maxGuidePoints)))
      : 48;
    if (latitudes.length < 2 || longitudes.length < 2 || rows.length < 2) {
      return [];
    }
    const rowIndexes = Array.from({ length: Math.min(latitudes.length, rows.length) }, (_, index) => index)
      .filter((index) => Number.isFinite(latitudes[index]) && Array.isArray(rows[index]));
    if (rowIndexes.length < 2) return [];

    const sampledRows = rowIndexes.length > maxGuidePoints
      ? Array.from({ length: maxGuidePoints }, (_, index) => rowIndexes[Math.round((index * (rowIndexes.length - 1)) / (maxGuidePoints - 1))])
      : rowIndexes;
    const ridgePoints = [];
    const valleyPoints = [];
    sampledRows.forEach((rowIndex) => {
      const row = rows[rowIndex] || [];
      let high = null;
      let low = null;
      row.forEach((rawValue, columnIndex) => {
        const elevationMeters = Number(rawValue);
        const lng = longitudes[columnIndex];
        if (!Number.isFinite(elevationMeters) || !Number.isFinite(lng)) return;
        const point = {
          lat: roundCoordinate(latitudes[rowIndex]),
          lng: roundCoordinate(lng),
          elevationMeters,
        };
        if (!high || point.elevationMeters > high.elevationMeters) high = point;
        if (!low || point.elevationMeters < low.elevationMeters) low = point;
      });
      if (high) ridgePoints.push(high);
      if (low) valleyPoints.push(low);
    });

    return [
      buildTerrainTileTraceGuide(tile, "ridge", ridgePoints),
      buildTerrainTileTraceGuide(tile, "valley", valleyPoints),
    ].filter(Boolean);
  }

  function buildTerrainTileTraceGuide(tile, kind, points) {
    const path = Array.isArray(points)
      ? points.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      : [];
    if (path.length < 2) return null;
    return {
      id: `${tile && tile.id ? String(tile.id) : "terrain-tile"}-${kind}-guide`,
      label: kind === "ridge" ? "自动山脊线" : "自动谷线",
      kind,
      sourceTileId: tile && tile.id ? String(tile.id) : "",
      points: path.map((point) => ({
        lat: point.lat,
        lng: point.lng,
        elevationMeters: point.elevationMeters,
      })),
    };
  }

  function terrainGridResolutionScore(grid) {
    if (!grid || !Array.isArray(grid.latitudes) || !Array.isArray(grid.longitudes)) {
      return 0;
    }
    const latitudes = grid.latitudes.map(Number).filter(Number.isFinite);
    const longitudes = grid.longitudes.map(Number).filter(Number.isFinite);
    if (latitudes.length < 2 || longitudes.length < 2) {
      return 0;
    }
    const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
    const lngSpan = Math.max(...longitudes) - Math.min(...longitudes);
    const area = Math.max(latSpan * lngSpan, 0.000001);
    return (latitudes.length * longitudes.length) / area;
  }

  function buildTerrainContourSegments(grid, levelsMeters) {
    if (!grid || !Array.isArray(levelsMeters) || !Array.isArray(grid.latitudes) || !Array.isArray(grid.longitudes) || !Array.isArray(grid.elevationsMeters)) {
      return [];
    }
    const latitudes = grid.latitudes.map(Number);
    const longitudes = grid.longitudes.map(Number);
    const rows = grid.elevationsMeters;
    if (latitudes.length < 2 || longitudes.length < 2) {
      return [];
    }

    const segments = [];
    levelsMeters.forEach((rawLevel) => {
      const levelMeters = Number(rawLevel);
      if (!Number.isFinite(levelMeters)) return;
      for (let y = 0; y < latitudes.length - 1; y += 1) {
        for (let x = 0; x < longitudes.length - 1; x += 1) {
          const corners = [
            { lat: latitudes[y], lng: longitudes[x], value: Number(rows[y] && rows[y][x]) },
            { lat: latitudes[y], lng: longitudes[x + 1], value: Number(rows[y] && rows[y][x + 1]) },
            { lat: latitudes[y + 1], lng: longitudes[x + 1], value: Number(rows[y + 1] && rows[y + 1][x + 1]) },
            { lat: latitudes[y + 1], lng: longitudes[x], value: Number(rows[y + 1] && rows[y + 1][x]) },
          ];
          if (!corners.every((corner) => Number.isFinite(corner.value))) continue;
          const intersections = [];
          addContourIntersection(intersections, corners[0], corners[1], levelMeters);
          addContourIntersection(intersections, corners[1], corners[2], levelMeters);
          addContourIntersection(intersections, corners[2], corners[3], levelMeters);
          addContourIntersection(intersections, corners[3], corners[0], levelMeters);
          const unique = uniqueContourPoints(intersections);
          if (unique.length === 2) {
            segments.push({ levelMeters, start: unique[0], end: unique[1] });
          } else if (unique.length === 4) {
            segments.push({ levelMeters, start: unique[0], end: unique[1] });
            segments.push({ levelMeters, start: unique[2], end: unique[3] });
          }
        }
      }
    });
    return segments;
  }

  function addContourIntersection(points, start, end, levelMeters) {
    const startDelta = start.value - levelMeters;
    const endDelta = end.value - levelMeters;
    if (startDelta === 0 && endDelta === 0) {
      return;
    }
    if (startDelta === 0) {
      points.push({ lat: start.lat, lng: start.lng });
      return;
    }
    if (endDelta === 0) {
      points.push({ lat: end.lat, lng: end.lng });
      return;
    }
    if ((startDelta > 0 && endDelta > 0) || (startDelta < 0 && endDelta < 0)) {
      return;
    }
    const t = (levelMeters - start.value) / (end.value - start.value);
    points.push({
      lat: roundCoordinate(start.lat + (end.lat - start.lat) * t),
      lng: roundCoordinate(start.lng + (end.lng - start.lng) * t),
    });
  }

  function uniqueContourPoints(points) {
    const seen = new Set();
    const unique = [];
    points.forEach((point) => {
      const key = `${roundCoordinate(point.lat)},${roundCoordinate(point.lng)}`;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push({ lat: roundCoordinate(point.lat), lng: roundCoordinate(point.lng) });
    });
    return unique;
  }

  function roundCoordinate(value) {
    return Number(Number(value).toFixed(6));
  }

  function findGridLowerIndex(values, target) {
    if (target === values[values.length - 1]) {
      return values.length - 2;
    }
    for (let index = 0; index < values.length - 1; index += 1) {
      if (target >= values[index] && target <= values[index + 1]) {
        return index;
      }
    }
    return null;
  }

  function sampleChinaTerrainElevation(lat, lng, terrainGrid, terrainDetailPatches, terrainDetailTiles) {
    return metersToTerrainElevation(sampleChinaTerrainMeters(lat, lng, terrainGrid, terrainDetailPatches, terrainDetailTiles));
  }

  function sampleChinaTerrainMeters(lat, lng, terrainGrid, terrainDetailPatches, terrainDetailTiles) {
    const sampledMeters = sampleTerrainTileMeters(terrainDetailTiles, lat, lng) ?? sampleTerrainGridMeters(terrainGrid, lat, lng);
    if (Number.isFinite(sampledMeters)) {
      return sampledMeters + sampleTerrainDetailPatchMeters(terrainDetailPatches, lat, lng);
    }
    return terrainElevationToMeters(estimateChinaElevation(lat, lng));
  }

  function buildTerrainTraceElevationProfile(trace, terrainGrid, terrainDetailPatches, terrainDetailTiles) {
    const path = buildTerrainTracePath(trace);
    const empty = {
      traceId: trace && trace.id ? String(trace.id) : "",
      sampleCount: 0,
      samples: [],
      minMeters: 0,
      maxMeters: 0,
      averageMeters: 0,
      reliefMeters: 0,
      lowPoint: null,
      highPoint: null,
    };
    if (path.length < 2) {
      return empty;
    }

    const samples = path
      .map((point, index) => ({
        index,
        lat: roundCoordinate(point.lat),
        lng: roundCoordinate(point.lng),
        elevationMeters: sampleChinaTerrainMeters(point.lat, point.lng, terrainGrid, terrainDetailPatches, terrainDetailTiles),
      }))
      .filter((sample) => Number.isFinite(sample.elevationMeters));
    if (!samples.length) {
      return empty;
    }

    const lowPoint = samples.reduce((lowest, sample) => (
      sample.elevationMeters < lowest.elevationMeters ? sample : lowest
    ), samples[0]);
    const highPoint = samples.reduce((highest, sample) => (
      sample.elevationMeters > highest.elevationMeters ? sample : highest
    ), samples[0]);
    const total = samples.reduce((sum, sample) => sum + sample.elevationMeters, 0);
    return {
      traceId: empty.traceId,
      sampleCount: samples.length,
      samples,
      minMeters: lowPoint.elevationMeters,
      maxMeters: highPoint.elevationMeters,
      averageMeters: total / samples.length,
      reliefMeters: highPoint.elevationMeters - lowPoint.elevationMeters,
      lowPoint: {
        lat: lowPoint.lat,
        lng: lowPoint.lng,
        elevationMeters: lowPoint.elevationMeters,
      },
      highPoint: {
        lat: highPoint.lat,
        lng: highPoint.lng,
        elevationMeters: highPoint.elevationMeters,
      },
    };
  }

  function buildTerrainTraceProfileChart(profile, options = {}) {
    const width = Math.max(1, Number(options.width) || 220);
    const height = Math.max(1, Number(options.height) || 72);
    const padding = Math.max(0, Number(options.padding) || 8);
    const samples = profile && Array.isArray(profile.samples) ? profile.samples : [];
    const validSamples = samples.filter((sample) => Number.isFinite(Number(sample && sample.elevationMeters)));
    const empty = {
      width,
      height,
      points: "",
      lowMarker: null,
      highMarker: null,
    };
    if (!validSamples.length) {
      return empty;
    }

    const elevations = validSamples.map((sample) => Number(sample.elevationMeters));
    const minMeters = Number.isFinite(Number(profile.minMeters)) ? Number(profile.minMeters) : Math.min(...elevations);
    const maxMeters = Number.isFinite(Number(profile.maxMeters)) ? Number(profile.maxMeters) : Math.max(...elevations);
    const relief = Math.max(1, maxMeters - minMeters);
    const innerWidth = Math.max(1, width - padding * 2);
    const innerHeight = Math.max(1, height - padding * 2);
    const points = validSamples.map((sample, index) => {
      const progress = validSamples.length === 1 ? 0 : index / (validSamples.length - 1);
      const elevation = Number(sample.elevationMeters);
      return {
        x: roundChartNumber(padding + progress * innerWidth),
        y: roundChartNumber(padding + (1 - (elevation - minMeters) / relief) * innerHeight),
        elevationMeters: elevation,
      };
    });
    const lowIndex = points.reduce((lowestIndex, point, index) => (
      point.elevationMeters < points[lowestIndex].elevationMeters ? index : lowestIndex
    ), 0);
    const highIndex = points.reduce((highestIndex, point, index) => (
      point.elevationMeters > points[highestIndex].elevationMeters ? index : highestIndex
    ), 0);

    return {
      width,
      height,
      points: points.map((point) => `${point.x},${point.y}`).join(" "),
      lowMarker: markerFromChartPoint(points[lowIndex]),
      highMarker: markerFromChartPoint(points[highIndex]),
    };
  }

  function markerFromChartPoint(point) {
    return {
      x: point.x,
      y: point.y,
      elevationMeters: point.elevationMeters,
    };
  }

  function roundChartNumber(value) {
    return Number(Number(value).toFixed(2));
  }

  function normalizePatchPathPoints(points) {
    return Array.isArray(points)
      ? points
        .map((point) => ({ lat: Number(point && point.lat), lng: Number(point && point.lng) }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      : [];
  }

  function pointToSegmentDistanceDegrees(target, start, end) {
    const midLat = (start.lat + end.lat) / 2;
    const lngScale = Math.max(0.35, Math.cos(toRadians(midLat)));
    const targetX = target.lng * lngScale;
    const targetY = target.lat;
    const startX = start.lng * lngScale;
    const startY = start.lat;
    const endX = end.lng * lngScale;
    const endY = end.lat;
    const dx = endX - startX;
    const dy = endY - startY;
    const lengthSquared = dx * dx + dy * dy;
    if (!Number.isFinite(lengthSquared) || lengthSquared <= 0) {
      return Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2);
    }
    const progress = clamp(((targetX - startX) * dx + (targetY - startY) * dy) / lengthSquared, 0, 1);
    const closestX = startX + dx * progress;
    const closestY = startY + dy * progress;
    return Math.sqrt((targetX - closestX) ** 2 + (targetY - closestY) ** 2);
  }

  function distanceToPatchPathDegrees(points, lat, lng) {
    const path = normalizePatchPathPoints(points);
    if (path.length < 2) {
      return Infinity;
    }
    const target = { lat, lng };
    let nearest = Infinity;
    for (let index = 0; index < path.length - 1; index += 1) {
      nearest = Math.min(nearest, pointToSegmentDistanceDegrees(target, path[index], path[index + 1]));
    }
    return nearest;
  }

  function sampleRadialTerrainPatchMeters(patch, targetLat, targetLng) {
    if (!patch || !patch.center) {
      return 0;
    }
    const centerLat = Number(patch.center.lat);
    const centerLng = Number(patch.center.lng);
    const radiusDegrees = Number(patch.radiusDegrees);
    const deltaMeters = Number(patch.deltaMeters);
    if (![centerLat, centerLng, radiusDegrees, deltaMeters].every(Number.isFinite) || radiusDegrees <= 0) {
      return 0;
    }
    const distance = Math.sqrt((targetLat - centerLat) ** 2 + (targetLng - centerLng) ** 2);
    const influence = clamp(1 - distance / radiusDegrees, 0, 1);
    return deltaMeters * influence;
  }

  function sampleLineBandTerrainPatchMeters(patch, targetLat, targetLng) {
    const widthDegrees = Number(patch && patch.widthDegrees);
    const deltaMeters = Number(patch && patch.deltaMeters);
    if (![widthDegrees, deltaMeters].every(Number.isFinite) || widthDegrees <= 0) {
      return 0;
    }
    const distance = distanceToPatchPathDegrees(patch.points || patch.path, targetLat, targetLng);
    if (!Number.isFinite(distance)) {
      return 0;
    }
    const influence = clamp(1 - distance / widthDegrees, 0, 1);
    return deltaMeters * influence;
  }

  function buildTerrainPolygonPatchRing(patch) {
    const points = normalizePatchPathPoints(patch && (patch.points || patch.polygon || patch.path))
      .filter((point) => isInRegion(point, CHINA_REGION));
    if (points.length < 3) {
      return [];
    }
    const ring = [...points];
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first.lat !== last.lat || first.lng !== last.lng) {
      ring.push({ ...first });
    }
    return ring;
  }

  function samplePolygonMaskTerrainPatchMeters(patch, targetLat, targetLng) {
    const ring = buildTerrainPolygonPatchRing(patch);
    const deltaMeters = Number(patch && patch.deltaMeters);
    if (ring.length < 4 || !Number.isFinite(deltaMeters)) {
      return 0;
    }
    const target = { lat: targetLat, lng: targetLng };
    if (!isPointInsidePolygon(target, ring)) {
      return 0;
    }
    const edgeFeatherDegrees = Number(patch && patch.edgeFeatherDegrees);
    if (!Number.isFinite(edgeFeatherDegrees) || edgeFeatherDegrees <= 0) {
      return deltaMeters;
    }
    const distance = distanceToPatchPathDegrees(ring, targetLat, targetLng);
    if (!Number.isFinite(distance)) {
      return 0;
    }
    return deltaMeters * clamp(distance / edgeFeatherDegrees, 0, 1);
  }

  function sampleTerrainDetailPatchMeters(patchLayer, lat, lng) {
    const patches = Array.isArray(patchLayer) ? patchLayer : patchLayer && patchLayer.patches;
    if (!Array.isArray(patches)) {
      return 0;
    }
    const targetLat = Number(lat);
    const targetLng = Number(lng);
    if (!Number.isFinite(targetLat) || !Number.isFinite(targetLng)) {
      return 0;
    }

    return patches.reduce((total, patch) => {
      const kind = patch && patch.kind ? String(patch.kind) : "radial";
      if (kind === "line-band") {
        return total + sampleLineBandTerrainPatchMeters(patch, targetLat, targetLng);
      }
      if (kind === "polygon-mask") {
        return total + samplePolygonMaskTerrainPatchMeters(patch, targetLat, targetLng);
      }
      if (kind === "radial") {
        return total + sampleRadialTerrainPatchMeters(patch, targetLat, targetLng);
      }
      return total;
    }, 0);
  }

  function buildTerrainLineBandPatchRing(patch) {
    const path = normalizePatchPathPoints(patch && (patch.points || patch.path));
    const widthDegrees = Number(patch && patch.widthDegrees);
    if (path.length < 2 || !Number.isFinite(widthDegrees) || widthDegrees <= 0) {
      return [];
    }
    const left = [];
    const right = [];
    path.forEach((point, index) => {
      const previous = path[Math.max(0, index - 1)];
      const next = path[Math.min(path.length - 1, index + 1)];
      const dLat = next.lat - previous.lat;
      const dLng = next.lng - previous.lng;
      const length = Math.sqrt(dLat * dLat + dLng * dLng);
      if (!Number.isFinite(length) || length <= 0) {
        return;
      }
      const normalLat = -dLng / length;
      const normalLng = dLat / length;
      left.push({
        lat: point.lat + normalLat * widthDegrees,
        lng: point.lng + normalLng * widthDegrees,
      });
      right.push({
        lat: point.lat - normalLat * widthDegrees,
        lng: point.lng - normalLng * widthDegrees,
      });
    });
    const ring = [...left, ...right.reverse()].filter((point) => isInRegion(point, CHINA_REGION));
    if (ring.length < 3) {
      return [];
    }
    ring.push({ ...ring[0] });
    return ring;
  }

  function buildTerrainDetailPatchRing(patch, segments = 48) {
    if (patch && patch.kind === "line-band") {
      return buildTerrainLineBandPatchRing(patch);
    }
    if (patch && patch.kind === "polygon-mask") {
      return buildTerrainPolygonPatchRing(patch);
    }
    if (!patch || !patch.center) {
      return [];
    }
    const centerLat = Number(patch.center.lat);
    const centerLng = Number(patch.center.lng);
    const radiusDegrees = Number(patch.radiusDegrees);
    const count = Math.max(8, Math.floor(Number(segments) || 48));
    if (![centerLat, centerLng, radiusDegrees].every(Number.isFinite) || radiusDegrees <= 0) {
      return [];
    }

    const points = [];
    const lngScale = Math.max(0.35, Math.cos(toRadians(centerLat)));
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      points.push({
        lat: centerLat + Math.cos(angle) * radiusDegrees,
        lng: centerLng + (Math.sin(angle) * radiusDegrees) / lngScale,
      });
    }
    points.push({ ...points[0] });
    return points;
  }

  function summarizeTerrainDetailPatches(patchLayer) {
    const patches = Array.isArray(patchLayer) ? patchLayer : patchLayer && patchLayer.patches;
    const items = Array.isArray(patches) ? patches : [];
    return items.reduce((summary, patch) => {
      const deltaMeters = Number(patch && patch.deltaMeters);
      if (deltaMeters > 0) summary.lifts += 1;
      if (deltaMeters < 0) summary.depressions += 1;
      summary.total += 1;
      return summary;
    }, { total: 0, lifts: 0, depressions: 0 });
  }

  function summarizeTerrainTraceGuides(traceLayer) {
    return getTerrainTraceGuideItems(traceLayer).reduce((summary, trace) => {
      if (trace.kind === "ridge") summary.ridges += 1;
      if (trace.kind === "basin-edge") summary.basinEdges += 1;
      if (trace.kind === "valley") summary.valleys += 1;
      summary.total += 1;
      return summary;
    }, { total: 0, ridges: 0, basinEdges: 0, valleys: 0 });
  }

  function summarizeTerrainTracePatchSuggestions(suggestionLayer) {
    const patches = suggestionLayer && Array.isArray(suggestionLayer.patches) ? suggestionLayer.patches : [];
    return patches.reduce((summary, patch) => {
      const deltaMeters = Number(patch && patch.deltaMeters);
      if (deltaMeters > 0) summary.lifts += 1;
      if (deltaMeters < 0) summary.depressions += 1;
      summary.total += 1;
      return summary;
    }, { total: 0, lifts: 0, depressions: 0 });
  }

  function metersToTerrainElevation(meters) {
    return clamp(0.025 + (Math.max(0, Number(meters)) / 6000) * 0.755, 0.025, 0.78);
  }

  function terrainElevationToMeters(elevation) {
    return Math.max(0, ((clamp(Number(elevation), 0.025, 0.78) - 0.025) / 0.755) * 6000);
  }

  function normalizeHotspot(hotspot) {
    return {
      id: String(hotspot.id),
      label: String(hotspot.label || hotspot.id),
      name: String(hotspot.name || hotspot.label || hotspot.id),
      region: String(hotspot.region || ""),
      lat: Number(hotspot.lat || 0),
      lng: Number(hotspot.lng || 0),
      value: Number(hotspot.value || 0),
      elevation: Number(hotspot.elevation || 0),
      tone: hotspot.tone || "cyan",
    };
  }

  function createInitialMapState(options = {}) {
    return {
      selectedHotspotId: null,
      hoveredHotspotId: null,
      autoRotate: options.autoRotate !== false,
      zoom: normalizeZoom(options.zoom || DEFAULT_CAMERA_DISTANCE),
      cameraTarget: { hotspotId: null, position: [0, 0, DEFAULT_CAMERA_DISTANCE] },
      hotspots: (options.hotspots || CHINA_TERRAIN_SITES).map(normalizeHotspot),
    };
  }

  function selectHotspot(state, hotspotId) {
    const hotspot = state.hotspots.find((item) => item.id === hotspotId) || null;
    if (!hotspot) {
      return { ...state, selectedHotspotId: null, cameraTarget: { hotspotId: null, position: [0, 0, state.zoom || DEFAULT_CAMERA_DISTANCE] } };
    }

    return {
      ...state,
      selectedHotspotId: hotspot.id,
      cameraTarget: {
        hotspotId: hotspot.id,
        position: latLngToVector3({ lat: hotspot.lat, lng: hotspot.lng, radius: normalizeZoom(state.zoom || DEFAULT_CAMERA_DISTANCE) }),
      },
    };
  }

  function findNearestHotspot(hotspots, pointer, hitRadius = 18) {
    let nearest = null;
    let nearestDistance = Infinity;
    hotspots.forEach((hotspot) => {
      if (!Number.isFinite(hotspot.screenX) || !Number.isFinite(hotspot.screenY)) return;
      const dx = hotspot.screenX - pointer.x;
      const dy = hotspot.screenY - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= hitRadius && distance < nearestDistance) {
        nearest = hotspot;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  function extractGeoJsonBoundaryRings(geojson, options = {}) {
    const region = options.region || CHINA_REGION;
    const minRingPoints = options.minRingPoints || 4;
    const features = Array.isArray(geojson && geojson.features) ? geojson.features : [];
    const rings = [];

    features.forEach((feature, featureIndex) => {
      const geometry = feature && feature.geometry;
      const properties = (feature && feature.properties) || {};
      const featureName =
        properties.shapeName ||
        properties.shapeISO ||
        properties.name ||
        properties.NAME_1 ||
        `feature-${featureIndex}`;

      getGeometryRings(geometry).forEach((ring, ringIndex) => {
        const points = ring
          .map(coordinateToPoint)
          .filter((point) => point && isInRegion(point, region));

        if (points.length >= minRingPoints) {
          rings.push({
            featureIndex,
            featureName,
            ringIndex,
            points,
          });
        }
      });
    });

    return {
      featureCount: features.length,
      rings,
    };
  }

  function isPointInsideGeoBoundaryRings(point, boundaryLayer) {
    if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) {
      return false;
    }
    const rings = Array.isArray(boundaryLayer)
      ? boundaryLayer
      : boundaryLayer && boundaryLayer.rings;
    if (!Array.isArray(rings) || !rings.length) {
      return false;
    }
    return rings.some((ring) => {
      const points = ring && Array.isArray(ring.points) ? ring.points : ring;
      return Array.isArray(points) && pointInRing(point, points);
    });
  }

  function isPointInsidePolygon(point, polygon) {
    if (!point || !Number.isFinite(Number(point.lat)) || !Number.isFinite(Number(point.lng))) {
      return false;
    }
    if (!Array.isArray(polygon) || polygon.length < 3) {
      return false;
    }
    return pointInRing(point, polygon);
  }

  function pointInRing(point, ringPoints) {
    const lat = Number(point.lat);
    const lng = Number(point.lng);
    let inside = false;
    for (let i = 0, j = ringPoints.length - 1; i < ringPoints.length; j = i, i += 1) {
      const current = ringPoints[i];
      const previous = ringPoints[j];
      if (!current || !previous) continue;
      const currentLat = Number(current.lat);
      const currentLng = Number(current.lng);
      const previousLat = Number(previous.lat);
      const previousLng = Number(previous.lng);
      if (![currentLat, currentLng, previousLat, previousLng].every(Number.isFinite)) continue;
      const crossesLatitude = (currentLat > lat) !== (previousLat > lat);
      if (!crossesLatitude) continue;
      const intersectionLng = ((previousLng - currentLng) * (lat - currentLat)) / (previousLat - currentLat) + currentLng;
      if (lng < intersectionLng) {
        inside = !inside;
      }
    }
    return inside;
  }

  function getGeometryRings(geometry) {
    if (!geometry || !geometry.type || !Array.isArray(geometry.coordinates)) {
      return [];
    }
    if (geometry.type === "Polygon") {
      return geometry.coordinates;
    }
    if (geometry.type === "MultiPolygon") {
      return geometry.coordinates.flatMap((polygon) => polygon);
    }
    return [];
  }

  function coordinateToPoint(coordinate) {
    if (!Array.isArray(coordinate) || coordinate.length < 2) {
      return null;
    }
    const lng = Number(coordinate[0]);
    const lat = Number(coordinate[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  }

  function summarizeTerrainCoverage() {
    return {
      blocks: FIVE_TERRAIN_BLOCKS.length,
      waterSystems: CHINA_WATER_SYSTEMS.length,
      boundaryGuides: CHINA_PROVINCE_BOUNDARY_GUIDES.length,
      completed: [
        "主要地貌板块",
        "SRTM90m DEM 中密度网格",
        "Natural Earth 主支流水系",
        "Natural Earth 湖泊/海岸线参考层",
        "精确国界/省界 GeoJSON",
        "省界引导线",
      ],
      nextGaps: [
        "补充南海诸岛与更细海岸线表达",
        "接入更高分辨率局部 DEM 或手工临摹补丁",
        "合并短等高线为更连续的地形参考线",
      ],
    };
  }

  return {
    DEFAULT_RADIUS,
    DEFAULT_CAMERA_DISTANCE,
    MIN_CAMERA_DISTANCE,
    MAX_CAMERA_DISTANCE,
    CHINA_BOUNDARY,
    CHINA_PROVINCE_BOUNDARY_GUIDES,
    CHINA_REGION,
    CHINA_TERRAIN_CITIES,
    CHINA_TERRAIN_SITES,
    CHINA_WATER_SYSTEMS,
    FIVE_TERRAIN_BLOCKS,
    MAP_LAYER_GROUPS,
    MAP_LAYERS,
    buildTerrainContourSegments,
    buildTerrainDetailPatchRing,
    buildTerrainTraceElevationProfile,
    buildTerrainTraceProfileChart,
    buildTerrainTracePatchSuggestions,
    buildTerrainTileTraceGuides,
    buildTerrainTracePath,
    addManualTerrainTracePoint,
    closeManualTerrainTraceDraft,
    clamp,
    clearManualTerrainTraceDraft,
    createManualTerrainTraceDraft,
    createDetailPatchVisibilityState,
    createTerrainPatchSuggestionGroupVisibilityState,
    createTerrainTraceVisibilityState,
    findTerrainPatchSuggestion,
    groupTerrainPatchSuggestionsByTrace,
    summarizeTerrainPatchSuggestionBundle,
    getGroupedRenderableMapLayers,
    getMapLayerGroupState,
    getRenderableMapLayers,
    getTerrainTraceCenter,
    getWaterSystemLayerId,
    latLngToVector3,
    vector3ToLatLng,
    normalizeZoom,
    planCityObservationVisibility,
    promoteTerrainPatchSuggestions,
    removeManualTerrainTracePointAt,
    reverseManualTerrainTraceDraft,
    isInRegion,
    regionProgress,
    estimateChinaElevation,
    sampleTerrainGridMeters,
    sampleTerrainTileMeters,
    sampleTerrainDetailPatchMeters,
    sampleChinaTerrainMeters,
    sampleChinaTerrainElevation,
    metersToTerrainElevation,
    terrainElevationToMeters,
    summarizeTerrainDetailPatches,
    summarizeTerrainTileAnalysis,
    summarizeTerrainTileTraceAid,
    summarizeTerrainTracePatchSuggestions,
    summarizeTerrainTraceGuides,
    extractGeoJsonBoundaryRings,
    isPointInsideGeoBoundaryRings,
    isPointInsidePolygon,
    summarizeTerrainCoverage,
    createLayerVisibilityState,
    createInitialMapState,
    toggleDetailPatchVisibility,
    toggleMapLayerGroup,
    toggleMapLayer,
    toggleTerrainPatchSuggestionGroupVisibility,
    toggleTerrainTraceVisibility,
    simplifyManualTerrainTraceDraft,
    smoothManualTerrainTraceDraft,
    undoManualTerrainTracePoint,
    updateManualTerrainTracePointAt,
    selectHotspot,
    findNearestHotspot,
  };
});
