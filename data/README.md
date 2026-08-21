# China Terrain Atlas Data

This folder stores downloaded geodata for replacing the current hand-drawn scaffold layers.

## Downloaded

- `raw/geoboundaries-chn-adm1-simplified.geojson`: China ADM1 boundaries, 34 features.
- `raw/geoboundaries-chn-adm1-meta.json`: geoBoundaries metadata and full download links.
- `raw/cn-atlas-prefectures.geojson`: GitHub cn-atlas prefecture-level China boundaries for sharper close-up administrative linework.
- `raw/natural-earth-admin0-50m/`: Natural Earth country boundaries.
- `raw/natural-earth-admin1-50m/`: Natural Earth province/state boundaries.
- `raw/natural-earth-rivers-10m/`: Natural Earth river and lake centerlines.
- `raw/natural-earth-lakes-10m/`: Natural Earth lake and reservoir polygons.
- `raw/natural-earth-coastline-10m/`: Natural Earth coastline linework.
- `terrain/china-rivers-natural-earth.json`: China-clipped Natural Earth river centerlines for main rivers and tributaries.
- `terrain/china-supplemental-tributaries.json`: project-authored coarse guide curves for key tributaries underrepresented in the extracted Natural Earth layer.
- `terrain/china-water-references-natural-earth.json`: China-clipped Natural Earth lake, coastline, and island reference outlines.
- `terrain/china-supplemental-water-references.json`: project-authored coarse lake outlines for important terrain-reference lakes missing from the Natural Earth China layer.
- `terrain/china-srtm90m-full.json`: full-density national real DEM height grid generated from the Open Topo Data SRTM 90m API.
- `terrain/china-local-dem-tiles.json`: local DEM override tiles for close-up inspection, initially seeded with an SRTM90m tile covering the Xuzhou-Lianyungang hills corridor.
- `terrain/china-srtm90m-medium.json`: medium-density real DEM height grid generated from the Open Topo Data SRTM 90m API.
- `terrain/china-srtm90m-sample.json`: low-resolution real DEM height grid generated from the Open Topo Data SRTM 90m API.
- `terrain/china-detail-patches.json`: local meter offsets layered over the DEM for later hand-sculpted terrain detail.
- `terrain/china-trace-guides.json`: project-authored ridge, basin-edge, and valley guide lines for later manual tracing.
- `terrain/china-trace-patch-suggestions.json`: draft radial patch candidates generated from the trace guide lines for manual review.

## Current Use

The runtime now loads `raw/cn-atlas-prefectures.geojson` from GitHub cn-atlas first for prefecture-level close-up linework, then falls back to `raw/geoboundaries-chn-adm1-simplified.geojson` when that file is unavailable. The hand-drawn province guides remain as fallback data in `world-map-core.js`.

The runtime also loads `terrain/china-srtm90m-full.json` before creating the China terrain mesh, falling back to `terrain/china-srtm90m-medium.json` and then `terrain/china-srtm90m-sample.json` when denser files are unavailable. The mesh samples this real height grid first and falls back to the procedural elevation estimator when a coordinate is outside the grid or the files cannot be loaded.

The runtime then loads `terrain/china-local-dem-tiles.json`. Any tile covering a sampled coordinate overrides the national DEM before local sculpting patches are applied. This keeps the current whole-China terrain light enough to run in the browser while allowing individual mountains, basins, and tracing regions to be replaced by denser DEM exports one tile at a time. Add future 30m/GeoTIFF-derived local exports as additional tile objects with `latitudes`, `longitudes`, and `elevationsMeters` arrays. Current SRTM 30m close-up tiles cover the Xuzhou-Lianyungang hills corridor, the Qinling main ridge, the Sichuan Basin east/Wushan transition, the Urumqi-Bogda section of the Tian Shan, and the Dali-Lijiang section of the Hengduan Mountains.

Generate or replace a close-up local terrain tile with the repeatable tile pipeline:

```powershell
npm run terrain:dem:tile -- --id=xuzhou-lianyungang-srtm30m-local --label="Xuzhou-Lianyungang SRTM 30m local tile" --dataset=srtm30m --bounds=34.12,34.72,117.05,119.45 --lat-intervals=24 --lng-intervals=48
```

The default local dataset is SRTM 30m through Open Topo Data. The generated tile is written into `terrain/china-local-dem-tiles.json`; if the same tile id already exists, it is replaced in place so a reviewed region can be regenerated at higher density without piling up stale layers. GitHub's `bopen/elevation` project is the closest source/tooling reference for a later offline SRTM 30m or GeoTIFF cache path; keep the runtime export shape identical so browser sampling still reads `latitudes`, `longitudes`, and `elevationsMeters`.

Terrain block colors are no longer flat regional fills. The runtime combines each block's terrain type palette with DEM hillshade, elevation bands, and procedural surface grain so deserts, loess, karst, plains, water-network lowlands, basins, and mountain belts remain visually distinct while still staying on one attached terrain surface.

After the DEM grid loads, the runtime generates contour segments from the DEM and draws them on the terrain surface. It then loads `terrain/china-detail-patches.json` and applies radial meter offsets over the base DEM. The browser also draws each patch as a range ring and center marker on the terrain surface. It also loads `terrain/china-trace-guides.json` and draws guide lines for ridges, basin edges, and valleys, including the Tian Shan ridge, Qilian ridge, Hengduan ridge, Himalaya ridge, Yarlung Tsangpo valley, and both west and east edge guides for the Sichuan Basin. Selecting a guide line samples a DEM-based elevation profile with the active detail patches applied, exposing relief, average elevation, a compact high/low profile chart, and matching high/low markers on the 3D terrain for later tracing review. This keeps later manual tracing or TopoExport-derived local corrections separate from the baseline DEM.

The runtime legend exposes these data sources as independent inspection layers: terrain grid, terrain blocks, main water systems, tributary water references, lake references, coastline/island references, national borders, province border references, DEM contours, local detail patches, manual tracing guide lines, trace-derived candidate patches, and observation points. Terrain, main rivers, lake references, and national borders are visible in the default terrain view so the model stays readable. Main rivers render animated flow particles plus downstream direction arrows, while lake references render terrain-attached pulsing ripple markers that drift along the nearest current-weather wind heading. Tributaries, coastline/island references, province borders, and observation points remain hidden by default, while the place buttons remain available for camera focus and the legend can re-enable any reference layer. Local detail patches, tracing guide lines, and candidate patch groups also render as hide/show and focus controls. Selecting a candidate group expands individual draft patch points for coordinate-level review without applying them to the terrain mesh. Keep future hand-sculpting data in separate patch files or patch groups so the UI can isolate the base DEM, water references, province references, contour reference, guide traces, draft candidates, and each local correction pass.

The authored terrain block polygons are now guarded by named physical-geography anchor tests. Add new anchors when correcting a block boundary so places such as basin-edge cities, plateau capitals, and plain reference cities remain inside the expected terrain region after later simplification. Current guarded corrections include Kashgar on the western Tarim Basin edge, Yining/Huocheng/Khorgos and Zhaosu/Tekes/Xinyuan/Nalati on the Ili Valley instead of the Junggar Basin or Tian Shan mountain body, Altay/Koktokay on the Altai Mountains instead of the Junggar Basin, Tianchi/Bogda on the Tian Shan instead of the Junggar Basin, Turpan and Hami on a separate Turpan-Hami Basin instead of the Tian Shan mountain block, Dunhuang on the western Hexi Corridor, Wuwei and Yongchang on the eastern Hexi Corridor instead of the Qilian Mountains, Kunlun Pass and the Yutian front on the Kunlun Mountains instead of the Qaidam Basin or broad plateau block, Qomolangma/Nyalam on the Himalaya Mountains instead of the broad Qinghai-Tibet Plateau, Nyingchi/Bomi/Medog/Mainling/Yarlung Tsangpo Canyon on southeast Tibet gorges instead of the broad Qinghai-Tibet Plateau or Himalaya priority, Xining on the northeastern Qinghai-Tibet Plateau edge, the Sichuan Basin transition near Kangding and Enshi, Wenchuan/Beichuan/Maoxian on the Longmen Mountains instead of the Sichuan Basin, Songpan/Jiuzhaigou/Huanglong on the Min Mountains instead of leaving the north Sichuan high mountains uncovered, Pu'er/Jinghong/Mengla on southern Yunnan low mountain valleys instead of the broad Yunnan-Guizhou Plateau while Kunming/Qujing/Chuxiong remain on the plateau, Xi'an/Xianyang/Weinan/Baoji on the Guanzhong Plain between the Loess Plateau and Qinling, Yinchuan/Wuzhong/Shizuishan on the Ningxia Plain rather than the Alxa desert or Loess Plateau, Ordos/Dongsheng/Mu Us Desert on the Ordos-Mu Us Plateau while Yulin remains on the Loess Plateau, Linhe/Wuyuan/Baotou/Hohhot/Togtoh on the Hetao-Tumochuan plain rather than the broad Inner Mongolia Plateau, Harbin/Qiqihar/Daqing/Suihua/Songyuan/Baicheng/Nenjiang on a separate Songnen Plain rather than the broad Northeast Plain or Khingan mountain blocks, Heihe on the Lesser Khingan northern edge, Jiamusi/Fujin/Tongjiang/Fuyuan/Jiansanjiang on the Sanjiang Plain rather than the Lesser Khingan or eastern mountain blocks, Shenyang/Liaoyang/Anshan/Panjin/Yingkou on the Liaohe Plain while Fushun/Benxi/Dandong/Kuandian/Fengcheng/Dalian stay on Liaodong hills, Datong on a separate Datong Basin block, Zhangjiakou/Wutaishan on Yan-Taihang Mountains instead of broad plateau blocks, Tianjin/Tangshan/Qinhuangdao on the North China Plain coast, Taishan on Shandong Hills instead of the North China Plain, Zhangjiajie/Enshi on Wuling Mountains instead of the western Middle-Lower Yangtze Plain, Dabie Mountain and Lushan as local mountain blocks that render above the surrounding Middle-Lower Yangtze Plain, Hangzhou/Jiaxing/Huzhou/Shaoxing/Ningbo on the Hangjiahu-Ningshao plains instead of leaving the Hangzhou Bay lowlands uncovered, Fuzhou/Xiamen/Quanzhou/Zhangzhou/Putian/Ningde/Wenzhou/Taizhou on Fujian-Zhejiang coastal lowlands instead of the broad Southeast Hills while Wuyishan/Sanming/Longyan remain in Southeast Hills, Xichang/Panzhihua on Liangshan-Panxi mountains instead of the Sichuan Basin or broad Yunnan-Guizhou Plateau, Hechi/Baise on Guangxi karst instead of broad Yunnan-Guizhou Plateau, Taipei on the Taipei Basin, Taoyuan/Taichung/Tainan/Kaohsiung on Taiwan western plains, Hualien/Taitung on the Huatung east-coast valley, Yushan/Alishan/Xueshan on Taiwan mountains instead of one whole-island mountain block, Haikou/Wenchang/Qionghai/Danzhou/Sanya/Dongfang on Hainan coastal lowlands, Wuzhi Mountain/Wuzhishan/Baisha/Baoting on Hainan central mountains instead of one whole-island hill block, Shantou/Jieyang/Chaozhou/Shanwei on the Chaoshan coastal plain instead of Southeast Hills, Zhanjiang/Leizhou/Xuwen/Maoming/Yangjiang on west Guangdong-Leizhou coastal lowlands, and Beihai/Qinzhou/Fangchenggang on Beibu Gulf coastal lowlands instead of leaving the coast uncovered or folded into Guangxi karst, the southeast Yunnan-Guizhou Plateau edge near Guilin and Nanning, the Loess Plateau edge where Lanzhou stays included while Baotou is excluded from the rough plateau block, and the southeast China gap where Wuyishan, Ganzhou, and Fuzhou are covered by a Southeast Hills block while Guangzhou is handled by a separate Pearl River Delta plain block.

The Northeast east guard pass keeps the broad `northeast-mountains` block as a background mountain body but adds local priority blocks for Changbai volcanic mountains around Changbai Mountain/Baishan/Tonghua, the Yanbian-Tumen basin around Yanji/Tumen/Hunchun, the Mudanjiang valley basin around Mudanjiang/Ning'an, and the Zhangguangcai-Laoye mountain belt around Dunhua/Suifenhe. Jiamusi remains on the Sanjiang Plain, Harbin remains on the Songnen Plain, and Kuandian remains outside the Changbai local block.

The southwest Yunnan guard pass adds local terrain blocks for Lincang/Cangyuan on western Yunnan mountain valleys and Wenshan/Yanshan/Qiubei on the southeast Yunnan karst plateau, while Pu'er/Jinghong/Mengla remain in southern Yunnan valleys, Baoshan remains in Hengduan Mountains, Mengzi remains on the Yunnan-Guizhou Plateau, and Hekou remains outside the plateau block.

The Red River-Ailao guard pass adds a narrow valley block for Yuanyang/Jinping/Pingbian/Hekou along the Red River and Nanxi River lowlands, while Mengzi/Gejiu/Jianshui stay on the Yunnan-Guizhou Plateau and Wenshan stays on the southeast Yunnan karst plateau.

The Dehong guard pass adds Ruili/Longchuan/Mangshi/Yingjiang to a Dehong river-valley lowland block that renders before the Hengduan mountain body, while Tengchong/Longling/Baoshan remain on the Hengduan side and Lincang remains in western Yunnan mountain valleys.

The Wumeng guard pass separates Zhaotong/Weining/Liupanshui/Bijie/Huize/Qiaojia/Yongshan into a Wumeng Mountains block, while Kunming/Qujing/Guiyang/Zunyi remain on the broader Yunnan-Guizhou Plateau, Yibin/Luzhou remain in the Sichuan Basin, and Xichang/Panzhihua remain in Liangshan-Panxi mountains.

The southern Jiangsu guard pass adds local terrain blocks for Zijinshan/Qixia/Jurong/Maoshan on the Ningzhen-Maoshan hills, Yixing/Liyang/Tianmu Lake on the Yili hills, and Changzhou/Wuxi/Suzhou/Kunshan/Taicang/Taihu on the Taihu-Yangtze Delta plain. Zhenjiang city core, Danyang, Huzhou, Jiaxing, Ma'anshan, and Wuhu stay outside these new local blocks so the hills and lowland plain do not swallow nearby transition areas.

The Hulunbuir guard pass adds a local Hulunbuir grassland plateau block for Hailar/Hulunbuir, Manzhouli, and Ergun west of the Greater Khingan range. Yakeshi, Genhe, Arxan, and Zalantun remain on the Greater Khingan mountain belt, while Qiqihar and the surrounding tested lowland cities stay on the Songnen Plain.

The Chang-Zhu-Tan guard pass adds a local Xiangjiang Chang-Zhu-Tan basin for Changsha, Zhuzhou, and Xiangtan rather than folding them into the broad Middle-Lower Yangtze Plain. Yueyang, Changde, and Yiyang remain on the Dongting-facing lowland plain, while Hengyang, Loudi, and Shaoyang remain in the Xiangzhong hills and basins.

The Poyang and northeast Jiangxi city pass exposes Nanchang and Jiujiang as tested prefecture cities on the Poyang Lake plain, while Jingdezhen stays on Jiangnan hills and Shangrao/Yingtan stay on the Huaiyu-Xinjiang hills. This pass uses the already guarded terrain boundaries and adds city controls for inspection rather than changing the terrain polygons.

The Pearl River Delta northeast-edge pass narrows the delta plain so Heyuan is no longer swallowed by the lowland polygon. Guangzhou, Foshan, Dongguan, Shenzhen, Zhuhai, Zhongshan, Jiangmen, Huizhou, and Zhaoqing remain on the Pearl River Delta plain, while Heyuan is guarded as southeast hills on the Dongjiang upper-basin side.

The South China coast city pass exposes representative prefecture cities for already guarded coastal terrain blocks: Guangzhou/Foshan/Dongguan/Shenzhen/Zhuhai on the Pearl River Delta plain, Shantou on the Chaoshan coastal plain, Zhanjiang on the west Guangdong-Leizhou lowlands, and Beihai on the Beibu Gulf coastal lowlands.

The Fujian-Zhejiang coast city pass exposes Fuzhou, Xiamen, Quanzhou, Zhangzhou, Putian, Ningde, Wenzhou, and Taizhou as tested prefecture cities on the already guarded Fujian-Zhejiang coastal lowlands. Wuyishan, Sanming, and Longyan remain guarded as southeast hills, so the coastal city controls do not blur the mountain/coastal-lowland split.

The Hangjiahu-Ningshao city pass exposes Hangzhou, Jiaxing, Huzhou, Shaoxing, and Ningbo as tested prefecture cities on the guarded Hangjiahu-Ningshao plains. The terrain boundary remains unchanged in this pass; nearby hill guards such as Mogan Mountain, Anji, Lin'an, Fuyang, Tonglu, Zhuji, Shengzhou, and Xinchang continue to keep the city controls from flattening the Zhejiang hill belts.

The southern Jiangsu city pass exposes Nanjing, Zhenjiang, Changzhou, Wuxi, Suzhou, and Nantong as tested prefecture cities across the existing Ningzhen-Maoshan hills, Middle-Lower Yangtze Plain, Taihu-Yangtze Delta plain, and Jianghuai-Lixiahe plain blocks. This keeps Nanjing attached to the guarded Ningzhen hill edge, keeps Zhenjiang city core out of the hill polygon, and keeps Changzhou/Wuxi/Suzhou on the Taihu lowland surface while Nantong remains north of the Yangtze mouth.

The Yangtze Delta and Jianghuai-Lixiahe city pass exposes Shanghai, Yangzhou, Taizhou (Jiangsu), Huai'an, and Yancheng as tested prefecture cities on their already guarded terrain blocks. Shanghai remains on the Middle-Lower Yangtze Plain, while Yangzhou, Taizhou (Jiangsu), Huai'an, and Yancheng remain on the Jianghuai-Lixiahe lowland surface. The Jiangsu Taizhou city id is kept separate from Taizhou, Zhejiang so the city controls preserve the coastal-lowland and Jianghuai-lowland split.

The Shandong guard pass splits the former broad Shandong hills coverage into Jiaodong hills for Qingdao/Laoshan/Yantai/Weihai and Luzhongnan mountains for Taishan/Laiwu/Yimengshan/Linyi, while Jinan/Zibo/Weifang/Dongying and the western Shandong lowland cities stay outside those local blocks.

The Henan guard pass separates Luoyang/Songshan/Dengfeng/Luanchuan/Funiu Mountain/Xixia into western Henan Funiu-Songshan mountains, Nanyang/Neixiang into the Nanyang Basin, and Xinyang/Tongbai/Jigongshan into Tongbai-Dabie mountains. Zhengzhou/Kaifeng/Xuchang/Zhoukou/Zhumadian remain on the Huang-Huai plain side, and Sanmenxia stays outside the Funiu-Songshan local block.

The Shanxi guard pass separates the province's north-south basin chain from the broad Loess Plateau and Yan-Taihang mountain polygons. Xinzhou/Dingxiang now render as the Xinding Basin, Taiyuan/Jinzhong-Yuci/Taigu as the Taiyuan Basin, Linfen/Hongtong/Houma as the Linfen Basin, Yuncheng/Yongji as the Yuncheng Basin, Yangquan/Shouyang as the Yangquan-Shouyang Basin, and Changzhi/Lucheng as the Shangdang-Changzhi Basin. Luliang/Guandi Mountain render on a local Luliang Mountains block and Zhongtiao renders on a local Zhongtiao Mountains block, while Wutaishan stays on Yan-Taihang Mountains and nearby basin cities stay outside adjacent mountain blocks.

The southern Shaanxi guard pass separates the Han River lowlands from the broad Qinling-Daba Mountains block. Hanzhong/Mianxian/Chenggu/Yangxian now render as the Hanzhong Basin, Shiquan/Ankang/Xunyang as the Ankang Han River valley, and Zhenba/Ningqiang/Daba Mountain as a local Daba Mountains block. Taibai Mountain and Foping remain on the Qinling-Daba mountain side, while Zhenba is also kept outside the Sichuan Basin north edge so the Daba Mountains do not get swallowed by the basin polygon.

The Sichuan Basin interior guard pass separates the broad basin into local terrain zones for clearer 3D tracing. Chengdu/Deyang/Mianyang/Meishan now render as the Chengdu Plain, Neijiang/Zigong/Suining/Nanchong as central Sichuan hills, and Chongqing/Guang'an/Dazhou/Wanzhou as eastern Sichuan parallel ridge-valleys. Ya'an remains on the broader Sichuan Basin western margin, while Dazhou/Wanzhou render before the Qinling-Daba Mountains block and Zhenba remains on the Daba Mountains side.

The Gannan-Aba guard pass adds a local plateau-grassland block for Aba County/Maerkang/Hongyuan/Ruoergai/Hezuo on the eastern Qinghai-Tibet Plateau edge, while Songpan/Jiuzhaigou/Huanglong remain in Min Mountains, Wenchuan remains in Longmen Mountains, Kangding remains in Hengduan Mountains, and Xining remains in the main Qinghai-Tibet Plateau block.

The Qiandongnan guard pass separates Kaili/Leishan/Rongjiang/Congjiang/Liping into a Miaoling-Dong mountain block, while Guiyang/Zunyi remain on the Yunnan-Guizhou Plateau, Tongren remains in Wuling Mountains, and Hechi/Guilin/Liuzhou remain in the Guangxi karst basin.

The Guizhou interior guard pass splits the former broad Yunnan-Guizhou Plateau coverage into local terrain units: Guiyang/Anshun/Qingzhen on the Qianzhong karst plateau, Zunyi/Loushan Pass on the Qianbei Dalou Mountains, Xingyi/Panxian on the Qianxinan karst plateau, and Duyun/Libo on Qiannan karst hills. Kaili/Congjiang remain on the Qiandongnan Miaoling Mountains side, Tongren/Fanjing Mountain remain in Wuling Mountains, Bijie/Liupanshui remain in Wumeng Mountains, and Hechi/Guilin remain in the Guangxi karst basin after narrowing the Guangxi block away from Libo and Congjiang.

The Xuefeng guard pass fills the western Hunan terrain gap with Huaihua/Xupu/Dongkou/Xinhua on a narrow Xuefeng Mountains block, while Changde/Yiyang/Changsha stay outside that mountain block on the Middle-Lower Yangtze Plain side.

The Xiangzhong guard pass fills the central Hunan hills-and-basins gap with Shaoyang/Shaodong/Loudi/Hengyang on a compact Xiangzhong block, while Xinhua stays on the Xuefeng Mountains side and Changsha/Yiyang/Chenzhou stay outside the block.

The Xiangnan-Nanling guard pass fills Yongzhou/Lingling with a compact Xiangnan hills-and-basins block, while Hengyang remains in the Xiangzhong block and Dao County/Jianghua remain on the Nanling side. It also tightens the Nanling east edge so Ganzhou renders as Southeast Hills while Guidong/Rucheng/Nanxiong/Renhua/Shaoguan stay in Nanling Mountains.

The Zhezhong-Zhenan guard pass fills the Zhejiang interior gap with Quzhou/Jinhua/Lishui on a local central-southern Zhejiang hills-and-basins block. Huangshan remains in Jiangnan Hills, Wuyishan/Sanming remain in Southeast Hills, Wenzhou/Taizhou remain on the Fujian-Zhejiang coastal lowlands, and Hangzhou/Shaoxing/Ningbo remain on the Hangjiahu-Ningshao plains.

The Hangjiahu-Ningshao priority guard pass keeps Huzhou/Jiaxing/Deqing rendering as the local Hangjiahu-Ningshao plains instead of the broader Middle-Lower Yangtze Plain, while Shanghai/Nanjing/Wuhan remain on the broad plain side and Nanchang is handled by the local Poyang Lake plain block.

The north Jiangxi guard pass separates Nanchang/Jiujiang/Yongxiu/Gongqingcheng/Hukou/Duchang/Poyang into a local Poyang Lake plain block before the broader Middle-Lower Yangtze Plain. Lushan still renders as its own mountain block above that lake-plain background, Jingdezhen remains in Jiangnan Hills, and Wuyuan/Sanqingshan/Shangrao/Yingtan/Guixi/Longhushan render as a Huaiyu-Xinjiang hills block instead of relying on broad Jiangnan or Southeast Hills coverage.

The northwest/east Zhejiang guard pass narrows the Hangjiahu-Ningshao plains to the Hangzhou-Huzhou-Jiaxing-Shaoxing-Ningbo lowland side while moving Moganshan/Anji/Lin'an/Tianmushan/Fuyang/Tonglu into a Tianmu-Mogan-Fuchun hills block. Zhuji/Shengzhou/Xinchang now render as a Kuaiji-Siming hills block, while Shaoxing/Ningbo/Yuyao remain outside that hills block on the Ning-Shao plain side.

The Wannan guard pass separates Huangshan/Jiuhuashan/Shitai/Qingyang/Jingxian/Jixi/Shexian/Qimen/Tunxi into a local Wannan mountains block before the broad Middle-Lower Yangtze Plain and Jiangnan Hills. Chizhou city core, Anqing, Tongling, Wuhu, Ma'anshan, Nanjing, Hefei, and Chaohu remain on the Yangtze/Jianghuai lowland side.

The Wanxi-Jianghuai guard pass narrows the Dabie Mountains to Jinzhai/Huoshan/Yuexi/Tianzhushan while moving Lu'an/Shucheng/Lujiang/Tongcheng/Qianshan/Taihu/Huaining into a local Wanxi-Jianghuai hills block. It also expands the Jianghuai-Lixiahe lowland westward so Huoqiu and Shouxian render with Bengbu/Huainan, while Hefei/Chaohu/Feixi/Anqing/Wuwei stay out of the hills block.

The Hefei-Chaohu guard pass adds a local low-hill/plain block for Hefei, Feixi, and Chaohu before the broad Middle-Lower Yangtze Plain. This keeps Hefei from rendering as a generic Yangtze lowland while preserving Lu'an/Shucheng/Lujiang on the Wanxi-Jianghuai hills side, Bengbu/Huainan/Chuzhou on the Jianghuai-Lixiahe lowland side, Anqing/Wuhu/Ma'anshan on the Yangtze lowland side, and Fuyang on the southern North China Plain edge.

The Luoxiao-Wugong guard pass separates Pingxiang/Wugongshan/Yichun/Fenyi/Jinggangshan/Lianhua into a local Luoxiao-Wugong mountain belt that renders before the broad Middle-Lower Yangtze Plain and Southeast Hills. Xinyu/Ji'an remain outside that mountain belt, Changsha/Nanchang remain on the plain side, and Ganzhou remains in Southeast Hills.

The latest Liaoxi guard pass also keeps Chifeng/Ningcheng/Jianping/Lingyuan/Chaoyang/Fuxin on a Liaoxi-Yanshan hills transition block, while Chengde remains on Yan-Taihang Mountains, Tangshan/Qinhuangdao remain on the North China Plain coast, and Tongliao remains on the Northeast Plain.

The Hebei Bashang guard pass adds a local plateau block for Zhangbei/Kangbao/Guyuan/Fengning/Weichang/Saihanba on the Bashang highland between the Inner Mongolia Plateau and the Yan-Taihang mountain belt. Zhangjiakou and Chengde city anchors remain on Yan-Taihang Mountains, Beijing/Baoding remain on the North China Plain side, Xilingol remains in the Inner Mongolia Plateau, and the Inner Mongolia Plateau polygon is narrowed away from the Hebei Bashang anchors.

The Liaoxi corridor guard pass separates Jinzhou/Huludao/Xingcheng/Suizhong/Shanhaiguan/Qinhuangdao/Beidaihe into a coastal lowland corridor between the Bohai-Liaodong Bay coast and the Liaoxi-Yanshan hills. Panjin/Yingkou/Gaizhou remain on the Liaohe Plain side, while Chaoyang/Lingyuan/Jianchang remain in the inland hills.

The Liaohe-Liaodong guard pass narrows the west edge of Liaodong hills so Anshan and Haicheng remain on the Liaohe Plain side, while Benxi/Fushun/Xiuyan/Dandong/Fengcheng/Dalian stay in Liaodong hills.

The Shandong hills guard pass extends the Tai-Yi/Shandong hills coverage to Jinan and Linyi while keeping Dezhou/Liaocheng/Heze/Jining on the North China Plain side.

The Jianghuai-Lixiahe guard pass adds a lowland block for Bengbu/Huainan/Huai'an/Yangzhou/Yancheng/Nantong while keeping Xuzhou/Suzhou/Huaibei/Fuyang on the North China Plain side and Nanjing/Shanghai on the Middle-Lower Yangtze Plain.

The Huanghuai-North Jiangsu guard pass adds a local plain block for Fuyang/Bozhou/Huaibei/Suzhou (Anhui), Xuzhou, Suqian, and Lianyungang before the broader North China Plain. Bengbu/Huainan/Huai'an/Yancheng remain on the Jianghuai-Lixiahe lowland side, so the new block fills the previous Lianyungang gap and separates the Huang-Huai/Subei surface from both the generic North China Plain and the Jianghuai lake-river lowlands.

The Lianyungang-Xuzhou hills guard pass adds local priority blocks for the Yuntai/Jinping mountains near Lianyungang and the Yunlong/Dadong/Jiawang low hills near Xuzhou. Suqian remains on the Huanghuai-North Jiangsu plain, while the Lianyungang and Xuzhou city centers render with the local hill/mountain blocks because those terrain details should be visible on the map surface. The runtime still composes terrain blocks into one attached surface mesh; it increases that mesh sampling density and blends more DEM hillshade/elevation color into each block so detailed relief is visible inside the colored regional board rather than becoming separate stacked layers.

The Hubei west guard pass separates Yichang/Zigui/Badong into a Three Gorges-Wushan hills block and Xiangyang/Danjiangkou into a Han River valley block, while Shennongjia/Shiyan stay on Qinling-Daba, Enshi stays on Wuling Mountains, Nanyang stays on the North China Plain side, and Jingmen/Jingzhou stay on the Middle-Lower Yangtze Plain.

The northern Guangdong Nanling guard pass extends the Nanling Mountains south to Qingyuan while keeping Guangzhou/Foshan/Dongguan/Huizhou/Zhaoqing on the Pearl River Delta side.

The southeast Guangxi guard pass adds a hills-and-basins block for Wuzhou and Yulin, while keeping Guigang/Nanning/Liuzhou/Guilin in the Guangxi karst basin and Beihai/Qinzhou/Fangchenggang plus west Guangdong coastal cities on their coastal lowland blocks.

Trace guides can be converted into reviewable patch candidates with `buildTerrainTracePatchSuggestions(trace)`. Ridge guides default to lift candidates, valley guides default to depression candidates, and basin-edge guides default to moderate lift candidates. The runtime renders this output as a "候选补丁" layer for review, but does not apply it to terrain elevation. The patch console can combine selected candidate points or all points in the current trace group, then shows the promotion command for that reviewed bundle. Treat it as a draft sculpting workload: inspect it against the DEM and contour layer before copying any candidate into `terrain/china-detail-patches.json`.

Regenerate the Natural Earth river layer after replacing or updating `raw/natural-earth-rivers-10m/`:

```powershell
node scripts/extract-china-rivers.js
```

The generated river layer clips Natural Earth river centerlines to the geoBoundaries China ADM1 mask. The runtime merges `terrain/china-supplemental-tributaries.json` into that layer before rendering so key missing tributaries such as the Jialing, Yalong, Wei, Fen, Huai, Xiang, Han, Gan, Bei, Dong, Hai, Yongding, Daqing, and Ziya rivers plus the North and South Canals appear as curved guides. Main rivers and lake references are visible in the default terrain view. Key tributaries and fine Natural Earth tributaries stay behind separate legend toggles so the base model stays readable while still allowing detailed inspection and later tracing.

Regenerate the Natural Earth lake/coastline reference layer after replacing or updating `raw/natural-earth-lakes-10m/` or `raw/natural-earth-coastline-10m/`:

```powershell
node scripts/extract-china-water-references.js
```

The generated water reference layer clips Natural Earth lake polygons and coastline paths to the geoBoundaries China ADM1 mask. The runtime merges `terrain/china-supplemental-water-references.json` into that layer so project-authored coarse outlines such as Dianchi Lake and Erhai Lake remain visible for Yunnan-Guizhou Plateau terrain tracing. Lake outlines are visible by default with rivers. Coastline/island outlines are kept in a separate hidden legend layer because they contain many short segments; turn them on for coastline position checking or later manual tracing.

Prepare the higher-accuracy HydroSHEDS water pipeline after downloading the official HydroRIVERS Asia and HydroLAKES shapefiles:

```powershell
npm run terrain:hydrosheds
```

Place HydroRIVERS files as `raw/hydrosheds-hydrorivers-asia/HydroRIVERS_v10_as.shp` and `.dbf`, and HydroLAKES files as `raw/hydrosheds-hydrolakes/HydroLAKES_polys_v10.shp` and `.dbf`. The script clips HydroRIVERS reaches and HydroLAKES polygons to the same geoBoundaries China ADM1 mask, preserving upstream/downstream identifiers, stream order, discharge, lake area, volume, and pour point metadata. It writes `terrain/china-rivers-hydrosheds.json` and `terrain/china-water-references-hydrosheds.json` for a later runtime switch from Natural Earth to HydroSHEDS once the generated layer has been visually reviewed.

Regenerate the medium DEM grid after changing the China terrain bounds or DEM sampling density:

```powershell
node scripts/generate-china-dem-grid.js
```

The generated grid uses batched Open Topo Data SRTM 90m requests and keeps a moderate point count so it is useful for national-scale terrain relief without turning the browser payload into a large GIS product.

Regenerate the suggestion file after changing `terrain/china-trace-guides.json`:

```powershell
node scripts/generate-trace-patch-suggestions.js
```

The generated candidates carry `reviewStatus: "draft"` so they remain separate from runtime-applied terrain corrections. After visual review, explicit candidate IDs can be promoted into a separate approved patch file:

```powershell
node scripts/promote-trace-patch-suggestions.js himalaya-main-ridge-sculpt-01 qinling-ridge-sculpt-03
```

The default output is `terrain/china-approved-detail-patches.json`. The runtime renders this file as a separate approved-preview layer for focus and visibility review, but it is not sampled by the terrain elevation mesh. Merge chosen patches into `terrain/china-detail-patches.json` only when they should affect the rendered terrain.

## Investigated But Not Downloaded

- TopoExport (`https://topoexport.com/`, `https://api.topoexport.com/regions`): useful for small-area terrain exports and export-format reference. Public metadata shows a global EDTM DTM source and a Hong Kong LiDAR DTM source, but no China-mainland-specific DTM dataset. Export and point lookup require account/API access, so no TopoExport files are stored here.

Next source layers:

1. Add South China Sea island and inset references beyond the ADM1 land mask.
2. Replace regional rough terrain areas with higher-resolution local DEM tiles or reviewed hand-traced patch data.
3. Add or replace local patches in `terrain/china-detail-patches.json` when hand-sculpting specific mountains, basins, valleys, and terrain edges.
4. Add or adjust guide lines in `terrain/china-trace-guides.json`, then convert selected lines into patch suggestions for manual review.
5. Merge short contour segments into longer contour paths after the DEM resolution is upgraded.
6. Generate and review the HydroRIVERS/HydroLAKES layers, then prefer them over Natural Earth for more accurate river reach and lake outlines.
