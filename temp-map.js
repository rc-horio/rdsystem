var map;
var marker1;
var marker2;
var poly;
var c_flg = 0;

//羽田制限表面地図座標
var mpA = {
    cd01 : {lat:35.58655083, lng:139.75781527},
    cd02 : {lat:35.58383361, lng:139.75209055},
    cd03 : {lat:35.58111638, lng:139.74636638},
    cd04 : {lat:35.58032333, lng:139.76083750},
    cd05 : {lat:35.57588777, lng:139.75149277},
    cd06 : {lat:35.56256722, lng:139.77317305},
    cd07 : {lat:35.56113166, lng:139.77014833},
    cd08 : {lat:35.56045157, lng:139.76871416},
    cd09 : {lat:35.55977361, lng:139.76728666},
    cd10 : {lat:35.55833805, lng:139.76426194},
    cd11 : {lat:35.53824388, lng:139.79044611},
    cd12 : {lat:35.53681194, lng:139.78742888},
    cd13 : {lat:35.53613305, lng:139.78599833},
    cd14 : {lat:35.53545444, lng:139.78456777},
    cd15 : {lat:35.53402222, lng:139.78155027},
    cd16 : {lat:35.52072722, lng:139.80317111},
    cd17 : {lat:35.51630222, lng:139.79384638},
    cd18 : {lat:35.51546027, lng:139.80832472},
    cd19 : {lat:35.51274555, lng:139.80260333},
    cd20 : {lat:35.51003083, lng:139.79688250},
    cd21 : {lat:35.43001805, lng:139.89180249},
    cd22 : {lat:35.41917361, lng:139.86893250},
    cd23 : {lat:35.40832472, lng:139.84606916}
}

var mpB = {
    cd01 : {lat:35.52953555, lng:139.73647888},
    cd02 : {lat:35.52643138, lng:139.74189638},
    cd03 : {lat:35.52332694, lng:139.74731361},
    cd04 : {lat:35.53429138, lng:139.74201138},
    cd05 : {lat:35.52919972, lng:139.75089611},
    cd06 : {lat:35.55100138, lng:139.75665250},
    cd07 : {lat:35.54934972, lng:139.75953527},
    cd08 : {lat:35.54857255, lng:139.76089284},
    cd09 : {lat:35.54779694, lng:139.76224444},
    cd10 : {lat:35.54614499, lng:139.76512666},
    cd11 : {lat:35.57015833, lng:139.77355694},
    cd12 : {lat:35.56868361, lng:139.77613027},
    cd13 : {lat:35.56790694, lng:139.77748500},
    cd14 : {lat:35.56713055, lng:139.77883972},
    cd15 : {lat:35.56565583, lng:139.78141250},
    cd16 : {lat:35.58527916, lng:139.78626805},
    cd17 : {lat:35.58056527, lng:139.79449222},
    cd18 : {lat:35.59314888, lng:139.79107722},
    cd19 : {lat:35.59004222, lng:139.79649694},
    cd20 : {lat:35.58693527, lng:139.80191638},
    cd21 : {lat:35.69099194, lng:139.85179111},
    cd22 : {lat:35.67855361, lng:139.87265111},
    cd23 : {lat:35.66611138, lng:139.89433833}
}

var mpC = {
    cd01 : {lat:35.59247083, lng:139.77532500},
    cd02 : {lat:35.58975750, lng:139.76959750},
    cd03 : {lat:35.58704388, lng:139.76387027},
    cd04 : {lat:35.58602972, lng:139.77844444},
    cd05 : {lat:35.58163388, lng:139.76916694},
    cd06 : {lat:35.56846222, lng:139.79062888},
    cd07 : {lat:35.56704472, lng:139.78763611},
    cd08 : {lat:35.56636638, lng:139.78620444},
    cd09 : {lat:35.56568805, lng:139.78477305},
    cd10 : {lat:35.56427027, lng:139.78178027},
    cd11 : {lat:35.54126722, lng:139.80975777},
    cd12 : {lat:35.53990972, lng:139.80689361},
    cd13 : {lat:35.53923138, lng:139.80546277},
    cd14 : {lat:35.53855305, lng:139.80403166},
    cd15 : {lat:35.53719527, lng:139.80116666},
    cd16 : {lat:35.52463694, lng:139.82182555},
    cd17 : {lat:35.52037166, lng:139.81282583},
    cd18 : {lat:35.51854888, lng:139.82777611},
    cd19 : {lat:35.51583694, lng:139.82205277},
    cd20 : {lat:35.51312444, lng:139.81633027},
    cd21 : {lat:35.43306916, lng:139.91119777},
    cd22 : {lat:35.42223527, lng:139.88832222},
    cd23 : {lat:35.41139666, lng:139.86545027}
}

var mpD = {
    cd01 : {lat:35.50734444, lng:139.77577444},
    cd02 : {lat:35.50368694, lng:139.78064666},
    cd03 : {lat:35.50002861, lng:139.78551777},
    cd04 : {lat:35.51377583, lng:139.78551777},
    cd05 : {lat:35.50851416, lng:139.79252555},
    cd06 : {lat:35.52612055, lng:139.79966444},
    cd07 : {lat:35.52451861, lng:139.80179777},
    cd08 : {lat:35.52360416, lng:139.80301611},
    cd09 : {lat:35.52268944, lng:139.80423416},
    cd10 : {lat:35.52108750, lng:139.80636750},
    cd11 : {lat:35.54342277, lng:139.81932972},
    cd12 : {lat:35.54191055, lng:139.82134361},
    cd13 : {lat:35.54099583, lng:139.82256194},
    cd14 : {lat:35.54008083, lng:139.82377972},
    cd15 : {lat:35.53856833, lng:139.82579388},
    cd16 : {lat:35.55529027, lng:139.83240750},
    cd17 : {lat:35.55021861, lng:139.83916000},
    cd18 : {lat:35.56456583, lng:139.84008000},
    cd19 : {lat:35.56090583, lng:139.84495277},
    cd20 : {lat:35.55724555, lng:139.84982527},
    cd21 : {lat:35.65515500, lng:139.91513111},
    cd22 : {lat:35.64050083, lng:139.93462833},
    cd23 : {lat:35.62584694, lng:139.95411777}
}


//-----------------------------------------------
//  地図表示
//-----------------------------------------------
function initialize() {

	//羽田空港標点
	var latlng = new google.maps.LatLng(35.55325248, 139.78122849);

	//GoogleMapAPIのオプション指定
	var opts = {
		zoom: 13,
		center: latlng,
		//scrollwheel: false,
		//draggable: false,
		//disableDefaultUI: true,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};

	//マップ生成
	map = new google.maps.Map(document.getElementById("map_canvas"), opts);

	//羽田空港標点にマーカーを付ける
	marker1 = new google.maps.Marker({
		position: latlng,
		flat: true,
		map: map
	});

	//住所指定＆地図クリック時のマーカー用
	marker2 = new google.maps.Marker({
		flat: true
	});

        $("#init").css("display", "none" );                                                            //追加 　初期画面では表示しない
	
	//滑走路Aの滑走路端から滑走路端の距離
	//var test01 = new google.maps.LatLng(35.55325248, 139.78122849);
	//var test02 = new google.maps.LatLng(35.36153575, 139.65872759);
	//console.log(google.maps.geometry.spherical.computeDistanceBetween(test01, test02));

	//テスト(C)
	//var testC = new google.maps.LatLng(35.65749893, 139.86187935);
	//var marker3 = new google.maps.Marker({
	//	position: testC,
	//	flat: true,
	//	map: map
	//});

	//テスト(G)
	//var testG = new google.maps.LatLng(35.69758991, 139.82441962);
	//var marker3 = new google.maps.Marker({
	//	position: testG,
	//	flat: true,
	//	map: map
	//});
	
	//テスト(K)
	//var testK = new google.maps.LatLng(35.42368297, 139.69201103);
	//var marker3 = new google.maps.Marker({
	//	position: testK,
	//	flat: true,
	//	map: map
	//});

	//テスト(D)
	//var testD = new google.maps.LatLng(35.49044145, 139.61583763);
	//var marker3 = new google.maps.Marker({
	//	position: testD,
	//	flat: true,
	//	map: map
	//});

	//テスト(I)
	//var testI = new google.maps.LatLng(35.76681069, 139.82351549);
	//var marker3 = new google.maps.Marker({
	//	position: testI,
	//	flat: true,
	//	map: map
	//});

	//テスト(J)
	//var testJ = new google.maps.LatLng(35.36153575, 139.65872759);
	//var marker3 = new google.maps.Marker({
	//	position: testJ,
	//	flat: true,
	//	map: map
	//});

	//-------------------------------------------------------------------------------

	//A～D滑走路で向きが違うので転移表面の座標に注意する事

	//A滑走路 座標
	var landingA = [
	[
		//着陸帯
		new google.maps.LatLng(mpA.cd07.lat, mpA.cd07.lng),		//07
		new google.maps.LatLng(mpA.cd09.lat, mpA.cd09.lng),		//09
		new google.maps.LatLng(mpA.cd14.lat, mpA.cd14.lng),		//14
		new google.maps.LatLng(mpA.cd12.lat, mpA.cd12.lng)		//12
	],
	[
		//進入表面北(延長進入表面が無い側)
		new google.maps.LatLng(mpA.cd01.lat, mpA.cd01.lng),		//01
		new google.maps.LatLng(mpA.cd03.lat, mpA.cd03.lng),		//03
		new google.maps.LatLng(mpA.cd09.lat, mpA.cd09.lng),		//09
		new google.maps.LatLng(mpA.cd07.lat, mpA.cd07.lng)		//07
	],
	[
		//進入表面南（延長進入表面が有る側）
		new google.maps.LatLng(mpA.cd12.lat, mpA.cd12.lng),		//12
		new google.maps.LatLng(mpA.cd14.lat, mpA.cd14.lng),		//14
		new google.maps.LatLng(mpA.cd20.lat, mpA.cd20.lng),		//20
		new google.maps.LatLng(mpA.cd18.lat, mpA.cd18.lng)		//18
	],
	[
		//延長進入表面
		new google.maps.LatLng(mpA.cd18.lat, mpA.cd18.lng),		//18
		new google.maps.LatLng(mpA.cd20.lat, mpA.cd20.lng),		//20
		new google.maps.LatLng(mpA.cd23.lat, mpA.cd23.lng),		//23
		new google.maps.LatLng(mpA.cd21.lat, mpA.cd21.lng)		//21
	],
	[
		//転移表面a
		new google.maps.LatLng(mpA.cd06.lat, mpA.cd06.lng),		//06
		new google.maps.LatLng(mpA.cd07.lat, mpA.cd07.lng),		//07
		new google.maps.LatLng(mpA.cd12.lat, mpA.cd12.lng),		//12
		new google.maps.LatLng(mpA.cd11.lat, mpA.cd11.lng)		//11
	],
	[
		//転移表面b（滑走路端の海抜高（北西側）	6.1m）
		new google.maps.LatLng(mpA.cd04.lat, mpA.cd04.lng),		//04
		new google.maps.LatLng(mpA.cd07.lat, mpA.cd07.lng),		//07
		new google.maps.LatLng(mpA.cd06.lat, mpA.cd06.lng)		//06
	],
	[
		//転移表面b（滑走路端の海抜高（南東側）	6.2m）
		new google.maps.LatLng(mpA.cd11.lat, mpA.cd11.lng),		//11
		new google.maps.LatLng(mpA.cd12.lat, mpA.cd12.lng),		//12
		new google.maps.LatLng(mpA.cd16.lat, mpA.cd16.lng)		//16
	],
	[
		//転移表面a
		new google.maps.LatLng(mpA.cd09.lat, mpA.cd09.lng),		//09
		new google.maps.LatLng(mpA.cd10.lat, mpA.cd10.lng),		//10
		new google.maps.LatLng(mpA.cd15.lat, mpA.cd15.lng),		//15
		new google.maps.LatLng(mpA.cd14.lat, mpA.cd14.lng)		//14
	],
	[
		//転移表面b（滑走路端の海抜高（北西側）	6.1m）
		new google.maps.LatLng(mpA.cd05.lat, mpA.cd05.lng),		//05
		new google.maps.LatLng(mpA.cd10.lat, mpA.cd10.lng),		//10
		new google.maps.LatLng(mpA.cd09.lat, mpA.cd09.lng)		//09
	],
	[
		//転移表面b（滑走路端の海抜高（南東側）	6.2m）
		new google.maps.LatLng(mpA.cd14.lat, mpA.cd14.lng),		//14
		new google.maps.LatLng(mpA.cd15.lat, mpA.cd15.lng),		//15
		new google.maps.LatLng(mpA.cd17.lat, mpA.cd17.lng)		//17
	]
	];

	//A滑走路 設定
	var landingA_setting = {
		paths         : landingA,
		strokeColor   : "#FF0000",
		strokeOpacity : 0.7,
		strokeWeight  : 0.5,
		fillColor     : "#FF0000",
		fillOpacity   : 0.05,
		zIndex        : 100
	};

	//A滑走路 地図表示
	landingA_obj = new google.maps.Polygon(landingA_setting);
	landingA_obj.setMap(map);

	//-------------------------------------------------------------------------------

	//B滑走路 座標
	var landingB = [
	[
		//着陸帯
		new google.maps.LatLng(mpB.cd07.lat, mpB.cd07.lng),		//07
		new google.maps.LatLng(mpB.cd09.lat, mpB.cd09.lng),		//09
		new google.maps.LatLng(mpB.cd14.lat, mpB.cd14.lng),		//14
		new google.maps.LatLng(mpB.cd12.lat, mpB.cd12.lng)		//12
	],
	[
		//進入表面北(延長進入表面が無い側)
		new google.maps.LatLng(mpB.cd01.lat, mpB.cd01.lng),		//01
		new google.maps.LatLng(mpB.cd03.lat, mpB.cd03.lng),		//03
		new google.maps.LatLng(mpB.cd09.lat, mpB.cd09.lng),		//09
		new google.maps.LatLng(mpB.cd07.lat, mpB.cd07.lng)		//07
	],
	[
		//進入表面南（延長進入表面が有る側）
		new google.maps.LatLng(mpB.cd12.lat, mpB.cd12.lng),		//12
		new google.maps.LatLng(mpB.cd14.lat, mpB.cd14.lng),		//14
		new google.maps.LatLng(mpB.cd20.lat, mpB.cd20.lng),		//20
		new google.maps.LatLng(mpB.cd18.lat, mpB.cd18.lng)		//18
	],
	[
		//延長進入表面
		new google.maps.LatLng(mpB.cd18.lat, mpB.cd18.lng),		//18
		new google.maps.LatLng(mpB.cd20.lat, mpB.cd20.lng),		//20
		new google.maps.LatLng(mpB.cd23.lat, mpB.cd23.lng),		//23
		new google.maps.LatLng(mpB.cd21.lat, mpB.cd21.lng)		//21
	],
	[
		//転移表面a
		new google.maps.LatLng(mpB.cd06.lat, mpB.cd06.lng),		//06
		new google.maps.LatLng(mpB.cd07.lat, mpB.cd07.lng),		//07
		new google.maps.LatLng(mpB.cd12.lat, mpB.cd12.lng),		//12
		new google.maps.LatLng(mpB.cd11.lat, mpB.cd11.lng)		//11
	],
	[
		//転移表面b（滑走路端の海抜高（南西側）	5.8m）
		new google.maps.LatLng(mpB.cd04.lat, mpB.cd04.lng),		//04
		new google.maps.LatLng(mpB.cd07.lat, mpB.cd07.lng),		//07
		new google.maps.LatLng(mpB.cd06.lat, mpB.cd06.lng)		//06
	],
	[
		//転移表面b（滑走路端の海抜高（北東側）	10.7m）
		new google.maps.LatLng(mpB.cd11.lat, mpB.cd11.lng),		//11
		new google.maps.LatLng(mpB.cd12.lat, mpB.cd12.lng),		//12
		new google.maps.LatLng(mpB.cd16.lat, mpB.cd16.lng)		//16
	],
	[
		//転移表面a
		new google.maps.LatLng(mpB.cd09.lat, mpB.cd09.lng),		//09
		new google.maps.LatLng(mpB.cd10.lat, mpB.cd10.lng),		//10
		new google.maps.LatLng(mpB.cd15.lat, mpB.cd15.lng),		//15
		new google.maps.LatLng(mpB.cd14.lat, mpB.cd14.lng)		//14
	],
	[
		//転移表面b（滑走路端の海抜高（南西側）	5.8m）
		new google.maps.LatLng(mpB.cd05.lat, mpB.cd05.lng),		//05
		new google.maps.LatLng(mpB.cd10.lat, mpB.cd10.lng),		//10
		new google.maps.LatLng(mpB.cd09.lat, mpB.cd09.lng)		//09
	],
	[
		//転移表面b（滑走路端の海抜高（北東側）	10.7m）
		new google.maps.LatLng(mpB.cd14.lat, mpB.cd14.lng),		//14
		new google.maps.LatLng(mpB.cd15.lat, mpB.cd15.lng),		//15
		new google.maps.LatLng(mpB.cd17.lat, mpB.cd17.lng)		//17
	]
	];

	//B滑走路 設定
	var landingB_setting = {
		paths         : landingB,
		strokeColor   : "#0000FF",
		strokeOpacity : 0.7,
		strokeWeight  : 0.5,
		fillColor     : "#0000FF",
		fillOpacity   : 0.05,
		zIndex        : 101
	};

	//B滑走路 地図表示
	landingB_obj = new google.maps.Polygon(landingB_setting);
	landingB_obj.setMap(map);

	//-------------------------------------------------------------------------------

	//C滑走路 座標
	var landingC = [
	[
		//着陸帯
		new google.maps.LatLng(mpC.cd07.lat, mpC.cd07.lng),		//07
		new google.maps.LatLng(mpC.cd09.lat, mpC.cd09.lng),		//09
		new google.maps.LatLng(mpC.cd14.lat, mpC.cd14.lng),		//14
		new google.maps.LatLng(mpC.cd12.lat, mpC.cd12.lng)		//12
	],
	[
		//進入表面北(延長進入表面が無い側)
		new google.maps.LatLng(mpC.cd01.lat, mpC.cd01.lng),		//01
		new google.maps.LatLng(mpC.cd03.lat, mpC.cd03.lng),		//03
		new google.maps.LatLng(mpC.cd09.lat, mpC.cd09.lng),		//09
		new google.maps.LatLng(mpC.cd07.lat, mpC.cd07.lng)		//07
	],
	[
		//進入表面南（延長進入表面が有る側）
		new google.maps.LatLng(mpC.cd12.lat, mpC.cd12.lng),		//12
		new google.maps.LatLng(mpC.cd14.lat, mpC.cd14.lng),		//14
		new google.maps.LatLng(mpC.cd20.lat, mpC.cd20.lng),		//20
		new google.maps.LatLng(mpC.cd18.lat, mpC.cd18.lng)		//18
	],
	[
		//延長進入表面
		new google.maps.LatLng(mpC.cd18.lat, mpC.cd18.lng),		//18
		new google.maps.LatLng(mpC.cd20.lat, mpC.cd20.lng),		//20
		new google.maps.LatLng(mpC.cd23.lat, mpC.cd23.lng),		//23
		new google.maps.LatLng(mpC.cd21.lat, mpC.cd21.lng)		//21
	],
	[
		//転移表面a
		new google.maps.LatLng(mpC.cd06.lat, mpC.cd06.lng),		//06
		new google.maps.LatLng(mpC.cd07.lat, mpC.cd07.lng),		//07
		new google.maps.LatLng(mpC.cd12.lat, mpC.cd12.lng),		//12
		new google.maps.LatLng(mpC.cd11.lat, mpC.cd11.lng)		//11
	],
	[
		//転移表面b（滑走路端の海抜高（北西側）	6.6m）
		new google.maps.LatLng(mpC.cd04.lat, mpC.cd04.lng),		//04
		new google.maps.LatLng(mpC.cd07.lat, mpC.cd07.lng),		//07
		new google.maps.LatLng(mpC.cd06.lat, mpC.cd06.lng)		//06
	],
	[
		//転移表面b（滑走路端の海抜高（南東側）	6.2m）
		new google.maps.LatLng(mpC.cd11.lat, mpC.cd11.lng),		//11
		new google.maps.LatLng(mpC.cd12.lat, mpC.cd12.lng),		//12
		new google.maps.LatLng(mpC.cd16.lat, mpC.cd16.lng)		//16
	],
	[
		//転移表面a
		new google.maps.LatLng(mpC.cd09.lat, mpC.cd09.lng),		//09
		new google.maps.LatLng(mpC.cd10.lat, mpC.cd10.lng),		//10
		new google.maps.LatLng(mpC.cd15.lat, mpC.cd15.lng),		//15
		new google.maps.LatLng(mpC.cd14.lat, mpC.cd14.lng)		//14
	],
	[
		//転移表面b（滑走路端の海抜高（北西側）	6.6m）
		new google.maps.LatLng(mpC.cd05.lat, mpC.cd05.lng),		//05
		new google.maps.LatLng(mpC.cd10.lat, mpC.cd10.lng),		//10
		new google.maps.LatLng(mpC.cd09.lat, mpC.cd09.lng)		//09
	],
	[
		//転移表面b（滑走路端の海抜高（南東側）	6.2m）
		new google.maps.LatLng(mpC.cd14.lat, mpC.cd14.lng),		//14
		new google.maps.LatLng(mpC.cd15.lat, mpC.cd15.lng),		//15
		new google.maps.LatLng(mpC.cd17.lat, mpC.cd17.lng)		//17
	]
	];

	//C滑走路 設定
	var landingC_setting = {
		paths         : landingC,
		strokeColor   : "#FF0000",
		strokeOpacity : 0.7,
		strokeWeight  : 0.5,
		fillColor     : "#FF0000",
		fillOpacity   : 0.05,
		zIndex        : 103
	};

	//C滑走路 地図表示
	landingC_obj = new google.maps.Polygon(landingC_setting);
	landingC_obj.setMap(map);


	//-------------------------------------------------------------------------------

	//D滑走路 座標
	var landingD = [
	[
		//着陸帯
		new google.maps.LatLng(mpD.cd07.lat, mpD.cd07.lng),		//07
		new google.maps.LatLng(mpD.cd09.lat, mpD.cd09.lng),		//09
		new google.maps.LatLng(mpD.cd14.lat, mpD.cd14.lng),		//14
		new google.maps.LatLng(mpD.cd12.lat, mpD.cd12.lng)		//12
	],
	[
		//進入表面北(延長進入表面が無い側)
		new google.maps.LatLng(mpD.cd01.lat, mpD.cd01.lng),		//01
		new google.maps.LatLng(mpD.cd03.lat, mpD.cd03.lng),		//03
		new google.maps.LatLng(mpD.cd09.lat, mpD.cd09.lng),		//09
		new google.maps.LatLng(mpD.cd07.lat, mpD.cd07.lng)		//07
	],
	[
		//進入表面南（延長進入表面が有る側）
		new google.maps.LatLng(mpD.cd12.lat, mpD.cd12.lng),		//12
		new google.maps.LatLng(mpD.cd14.lat, mpD.cd14.lng),		//14
		new google.maps.LatLng(mpD.cd20.lat, mpD.cd20.lng),		//20
		new google.maps.LatLng(mpD.cd18.lat, mpD.cd18.lng)		//18
	],
	[
		//延長進入表面
		new google.maps.LatLng(mpD.cd18.lat, mpD.cd18.lng),		//18
		new google.maps.LatLng(mpD.cd20.lat, mpD.cd20.lng),		//20
		new google.maps.LatLng(mpD.cd23.lat, mpD.cd23.lng),		//23
		new google.maps.LatLng(mpD.cd21.lat, mpD.cd21.lng)		//21
	],
	[
		//転移表面a
		new google.maps.LatLng(mpD.cd06.lat, mpD.cd06.lng),		//06
		new google.maps.LatLng(mpD.cd07.lat, mpD.cd07.lng),		//07
		new google.maps.LatLng(mpD.cd12.lat, mpD.cd12.lng),		//12
		new google.maps.LatLng(mpD.cd11.lat, mpD.cd11.lng)		//11
	],
	[
		//転移表面b（滑走路端の海抜高（南西側）	13.866m）
		new google.maps.LatLng(mpD.cd04.lat, mpD.cd04.lng),		//04
		new google.maps.LatLng(mpD.cd07.lat, mpD.cd07.lng),		//07
		new google.maps.LatLng(mpD.cd06.lat, mpD.cd06.lng)		//06
	],
	[
		//転移表面b（滑走路端の海抜高（北東側）	15.966m）
		new google.maps.LatLng(mpD.cd11.lat, mpD.cd11.lng),		//11
		new google.maps.LatLng(mpD.cd12.lat, mpD.cd12.lng),		//12
		new google.maps.LatLng(mpD.cd16.lat, mpD.cd16.lng)		//16
	],
	[
		//転移表面a
		new google.maps.LatLng(mpD.cd09.lat, mpD.cd09.lng),		//09
		new google.maps.LatLng(mpD.cd10.lat, mpD.cd10.lng),		//10
		new google.maps.LatLng(mpD.cd15.lat, mpD.cd15.lng),		//15
		new google.maps.LatLng(mpD.cd14.lat, mpD.cd14.lng)		//14
	],
	[
		//転移表面b（滑走路端の海抜高（南西側）	13.866m）
		new google.maps.LatLng(mpD.cd05.lat, mpD.cd05.lng),		//05
		new google.maps.LatLng(mpD.cd10.lat, mpD.cd10.lng),		//10
		new google.maps.LatLng(mpD.cd09.lat, mpD.cd09.lng)		//09
	],
	[
		//転移表面b（滑走路端の海抜高（北東側）	15.966m）
		new google.maps.LatLng(mpD.cd14.lat, mpD.cd14.lng),		//14
		new google.maps.LatLng(mpD.cd15.lat, mpD.cd15.lng),		//15
		new google.maps.LatLng(mpD.cd17.lat, mpD.cd17.lng)		//17
	]
	];

	//D滑走路 設定
	var landingD_setting = {
		paths         : landingD,
		strokeColor   : "#0000FF",
		strokeOpacity : 0.7,
		strokeWeight  : 0.5,
		fillColor     : "#0000FF",
		fillOpacity   : 0.05,
		zIndex        : 104
	};

	//D滑走路 地図表示
	landingD_obj = new google.maps.Polygon(landingD_setting);
	landingD_obj.setMap(map);
	
	//-------------------------------------------------------------------------------

	//切欠(円錐表面) 座標パス
	var landingKi = [
new google.maps.LatLng(35.683341667,139.784727778),
new google.maps.LatLng(35.7018472220001,139.790780556),
new google.maps.LatLng(35.7016857150001,139.793805384),
new google.maps.LatLng(35.7014820720001,139.7969717),
new google.maps.LatLng(35.701233302,139.800133185),
new google.maps.LatLng(35.70093948,139.803288876),
new google.maps.LatLng(35.700600695,139.806437811),
new google.maps.LatLng(35.7002170520001,139.809579032),
new google.maps.LatLng(35.6997886660001,139.81271158),
new google.maps.LatLng(35.699315669,139.815834504),
new google.maps.LatLng(35.6987982040001,139.818946849),
new google.maps.LatLng(35.6982364290001,139.82204767),
new google.maps.LatLng(35.6977694440001,139.824425),
new google.maps.LatLng(35.6976305160001,139.825136021),
new google.maps.LatLng(35.6969806470001,139.828210962),
new google.maps.LatLng(35.6962870230001,139.831271556),
new google.maps.LatLng(35.695549853,139.83431687),
new google.maps.LatLng(35.694769363,139.837345977),
new google.maps.LatLng(35.69394579,139.840357955),
new google.maps.LatLng(35.6930793860001,139.843351886),
new google.maps.LatLng(35.692170413,139.846326857),
new google.maps.LatLng(35.6912191490001,139.849281963),
new google.maps.LatLng(35.6902258840001,139.852216303),
new google.maps.LatLng(35.68919092,139.855128985),
new google.maps.LatLng(35.6881145720001,139.858019119),
new google.maps.LatLng(35.6869971690001,139.860885827),
new google.maps.LatLng(35.6858390500001,139.863728234),
new google.maps.LatLng(35.6846405690001,139.866545476),
new google.maps.LatLng(35.6834020910001,139.869336693),
new google.maps.LatLng(35.6821239920001,139.872101036),
new google.maps.LatLng(35.6808066620001,139.874837663),
new google.maps.LatLng(35.6794505030001,139.877545739),
new google.maps.LatLng(35.6780559270001,139.880224441),
new google.maps.LatLng(35.6766233600001,139.882872952),
new google.maps.LatLng(35.6751532370001,139.885490465),
new google.maps.LatLng(35.6736460070001,139.888076183),
new google.maps.LatLng(35.6721021280001,139.890629319),
new google.maps.LatLng(35.6705220710001,139.893149094),
new google.maps.LatLng(35.6689063170001,139.895634742),
new google.maps.LatLng(35.6672553590001,139.898085504),
new google.maps.LatLng(35.6655696990001,139.900500635),
new google.maps.LatLng(35.6638498500001,139.902879399),
new google.maps.LatLng(35.6620963380001,139.905221071),
new google.maps.LatLng(35.6603096950001,139.907524937),
new google.maps.LatLng(35.658490466,139.909790297),
new google.maps.LatLng(35.6566392050001,139.91201646),
new google.maps.LatLng(35.654756476,139.914202748),
new google.maps.LatLng(35.652842852,139.916348495),
new google.maps.LatLng(35.6508989170001,139.918453048),
new google.maps.LatLng(35.6489252630001,139.920515764),
new google.maps.LatLng(35.6469224900001,139.922536017),
new google.maps.LatLng(35.6448912100001,139.92451319),
new google.maps.LatLng(35.642832039,139.926446682),
new google.maps.LatLng(35.640745607,139.928335903),
new google.maps.LatLng(35.6386325480001,139.930180277),
new google.maps.LatLng(35.6364935060001,139.931979244),
new google.maps.LatLng(35.6343291330001,139.933732255),
new google.maps.LatLng(35.632140087,139.935438777),
new google.maps.LatLng(35.6299270370001,139.937098288),
new google.maps.LatLng(35.627690655,139.938710284),
new google.maps.LatLng(35.6254316230001,139.940274274),
new google.maps.LatLng(35.6231506290001,139.941789782),
new google.maps.LatLng(35.6208483680001,139.943256345),
new google.maps.LatLng(35.618525542,139.944673517),
new google.maps.LatLng(35.6161828570001,139.946040866),
new google.maps.LatLng(35.6138210280001,139.947357977),
new google.maps.LatLng(35.6114407730001,139.948624447),
new google.maps.LatLng(35.6090428190001,139.94983989),
new google.maps.LatLng(35.6066278950001,139.951003937),
new google.maps.LatLng(35.6041967370001,139.952116234),
new google.maps.LatLng(35.601750085,139.95317644),
new google.maps.LatLng(35.5992886850001,139.954184234),
new google.maps.LatLng(35.5968132870001,139.955139307),
new google.maps.LatLng(35.594324644,139.956041371),
new google.maps.LatLng(35.591823515,139.956890148),
new google.maps.LatLng(35.5893106620001,139.957685382),
new google.maps.LatLng(35.5867868490001,139.95842683),
new google.maps.LatLng(35.5842528460001,139.959114265),
new google.maps.LatLng(35.581709425,139.959747479),
new google.maps.LatLng(35.5791573600001,139.960326279),
new google.maps.LatLng(35.5765974290001,139.960850487),
new google.maps.LatLng(35.5740304110001,139.961319946),
new google.maps.LatLng(35.571457089,139.961734511),
new google.maps.LatLng(35.5688782460001,139.962094057),
new google.maps.LatLng(35.5662946680001,139.962398473),
new google.maps.LatLng(35.5637071420001,139.962647668),
new google.maps.LatLng(35.561116456,139.962841564),
new google.maps.LatLng(35.5585234,139.962980104),
new google.maps.LatLng(35.5559287620001,139.963063245),
new google.maps.LatLng(35.5533333330001,139.963090961),
new google.maps.LatLng(35.5507379050001,139.963063245),
new google.maps.LatLng(35.5481432670001,139.962980104),
new google.maps.LatLng(35.54555021,139.962841564),
new google.maps.LatLng(35.5429595240001,139.962647668),
new google.maps.LatLng(35.5403719980001,139.962398473),
new google.maps.LatLng(35.5377884200001,139.962094057),
new google.maps.LatLng(35.535209577,139.961734511),
new google.maps.LatLng(35.5326362550001,139.961319946),
new google.maps.LatLng(35.5300692380001,139.960850487),
new google.maps.LatLng(35.5275093070001,139.960326279),
new google.maps.LatLng(35.5249572420001,139.959747479),
new google.maps.LatLng(35.522413821,139.959114265),
new google.maps.LatLng(35.519879818,139.95842683),
new google.maps.LatLng(35.5173560050001,139.957685382),
new google.maps.LatLng(35.5148431520001,139.956890148),
new google.maps.LatLng(35.512342022,139.956041371),
new google.maps.LatLng(35.50985338,139.955139307),
new google.maps.LatLng(35.507377981,139.954184234),
new google.maps.LatLng(35.5049165820001,139.95317644),
new google.maps.LatLng(35.5024699300001,139.952116234),
new google.maps.LatLng(35.500038772,139.951003937),
new google.maps.LatLng(35.497623848,139.94983989),
new google.maps.LatLng(35.4952258930001,139.948624447),
new google.maps.LatLng(35.4928456390001,139.947357977),
new google.maps.LatLng(35.4904838100001,139.946040866),
new google.maps.LatLng(35.4881411250001,139.944673517),
new google.maps.LatLng(35.4858182980001,139.943256345),
new google.maps.LatLng(35.4835160380001,139.941789782),
new google.maps.LatLng(35.4812350440001,139.940274274),
new google.maps.LatLng(35.4789760120001,139.938710284),
new google.maps.LatLng(35.4767396300001,139.937098288),
new google.maps.LatLng(35.474526579,139.935438777),
new google.maps.LatLng(35.4723375340001,139.933732255),
new google.maps.LatLng(35.470173161,139.931979244),
new google.maps.LatLng(35.468034119,139.930180277),
new google.maps.LatLng(35.4659210600001,139.928335903),
new google.maps.LatLng(35.463834627,139.926446682),
new google.maps.LatLng(35.461775457,139.92451319),
new google.maps.LatLng(35.4597441760001,139.922536017),
new google.maps.LatLng(35.457741404,139.920515764),
new google.maps.LatLng(35.4557677490001,139.918453048),
new google.maps.LatLng(35.4538238140001,139.916348495),
new google.maps.LatLng(35.4519101910001,139.914202748),
new google.maps.LatLng(35.450027462,139.91201646),
new google.maps.LatLng(35.4481762010001,139.909790297),
new google.maps.LatLng(35.446356972,139.907524937),
new google.maps.LatLng(35.444570329,139.905221071),
new google.maps.LatLng(35.4428168160001,139.902879399),
new google.maps.LatLng(35.4410969680001,139.900500635),
new google.maps.LatLng(35.439411308,139.898085504),
new google.maps.LatLng(35.4377603490001,139.895634742),
new google.maps.LatLng(35.4361445960001,139.893149094),
new google.maps.LatLng(35.4345645390001,139.890629319),
new google.maps.LatLng(35.4330206600001,139.888076183),
new google.maps.LatLng(35.4315134300001,139.885490465),
new google.maps.LatLng(35.4300433070001,139.882872952),
new google.maps.LatLng(35.4286107400001,139.880224441),
new google.maps.LatLng(35.4272161640001,139.877545739),
new google.maps.LatLng(35.4258600050001,139.874837663),
new google.maps.LatLng(35.4245426750001,139.872101036),
new google.maps.LatLng(35.4232645760001,139.869336693),
new google.maps.LatLng(35.4220260980001,139.866545476),
new google.maps.LatLng(35.420827617,139.863728234),
new google.maps.LatLng(35.4196694980001,139.860885827),
new google.maps.LatLng(35.4185520950001,139.858019119),
new google.maps.LatLng(35.4174757470001,139.855128985),
new google.maps.LatLng(35.416440783,139.852216303),
new google.maps.LatLng(35.4154475180001,139.849281963),
new google.maps.LatLng(35.4144962540001,139.846326857),
new google.maps.LatLng(35.413587281,139.843351886),
new google.maps.LatLng(35.412720876,139.840357955),
new google.maps.LatLng(35.411897303,139.837345977),
new google.maps.LatLng(35.411116813,139.83431687),
new google.maps.LatLng(35.410379644,139.831271556),
new google.maps.LatLng(35.409686019,139.828210962),
new google.maps.LatLng(35.4090361510001,139.825136021),
new google.maps.LatLng(35.4084302370001,139.82204767),
new google.maps.LatLng(35.4078684620001,139.818946849),
new google.maps.LatLng(35.4073509980001,139.815834504),
new google.maps.LatLng(35.406878,139.81271158),
new google.maps.LatLng(35.406449615,139.809579032),
new google.maps.LatLng(35.4060659710001,139.806437811),
new google.maps.LatLng(35.4057271870001,139.803288876),
new google.maps.LatLng(35.4054333650001,139.800133185),
new google.maps.LatLng(35.405184595,139.7969717),
new google.maps.LatLng(35.4049809520001,139.793805384),
new google.maps.LatLng(35.404822499,139.790635201),
new google.maps.LatLng(35.404709284,139.787462116),
new google.maps.LatLng(35.4046413410001,139.784287097),
new google.maps.LatLng(35.4046186910001,139.781111111),
new google.maps.LatLng(35.4046413410001,139.777935125),
new google.maps.LatLng(35.404709284,139.774760106),
new google.maps.LatLng(35.404822499,139.771587022),
new google.maps.LatLng(35.4049809520001,139.768416838),
new google.maps.LatLng(35.405184595,139.765250522),
new google.maps.LatLng(35.4054333650001,139.762089037),
new google.maps.LatLng(35.4057271870001,139.758933346),
new google.maps.LatLng(35.4060659710001,139.755784411),
new google.maps.LatLng(35.406449615,139.752643191),
new google.maps.LatLng(35.406878,139.749510642),
new google.maps.LatLng(35.4073509980001,139.746387719),
new google.maps.LatLng(35.4078684620001,139.743275373),
new google.maps.LatLng(35.4084302370001,139.740174552),
new google.maps.LatLng(35.4090361510001,139.737086201),
new google.maps.LatLng(35.409686019,139.73401126),
new google.maps.LatLng(35.410379644,139.730950666),
new google.maps.LatLng(35.411116813,139.727905352),
new google.maps.LatLng(35.411897303,139.724876245),
new google.maps.LatLng(35.412720876,139.721864267),
new google.maps.LatLng(35.413587281,139.718870337),
new google.maps.LatLng(35.4144962540001,139.715895365),
new google.maps.LatLng(35.4154475180001,139.712940259),
new google.maps.LatLng(35.416440783,139.710005919),
new google.maps.LatLng(35.4174757470001,139.707093238),
new google.maps.LatLng(35.4185520950001,139.704203103),
new google.maps.LatLng(35.4196694980001,139.701336395),
new google.maps.LatLng(35.420827617,139.698493988),
new google.maps.LatLng(35.4220260980001,139.695676746),
new google.maps.LatLng(35.4232645760001,139.692885529),
new google.maps.LatLng(35.423697222,139.691952778),
new google.maps.LatLng(35.4245426750001,139.690121186),
new google.maps.LatLng(35.4258600050001,139.687384559),
new google.maps.LatLng(35.4272161640001,139.684676483),
new google.maps.LatLng(35.4286107400001,139.681997781),
new google.maps.LatLng(35.4300433070001,139.67934927),
new google.maps.LatLng(35.4315134300001,139.676731757),
new google.maps.LatLng(35.4330206600001,139.674146039),
new google.maps.LatLng(35.4345645390001,139.671592903),
new google.maps.LatLng(35.4361445960001,139.669073128),
new google.maps.LatLng(35.4377603490001,139.666587481),
new google.maps.LatLng(35.439411308,139.664136718),
new google.maps.LatLng(35.4410969680001,139.661721587),
new google.maps.LatLng(35.4428168160001,139.659342824),
new google.maps.LatLng(35.444570329,139.657001152),
new google.maps.LatLng(35.446356972,139.654697285),
new google.maps.LatLng(35.4481762010001,139.652431925),
new google.maps.LatLng(35.450027462,139.650205762),
new google.maps.LatLng(35.4519101910001,139.648019474),
new google.maps.LatLng(35.4538238140001,139.645873727),
new google.maps.LatLng(35.4557677490001,139.643769175),
new google.maps.LatLng(35.457741404,139.641706458),
new google.maps.LatLng(35.4597441760001,139.639686205),
new google.maps.LatLng(35.461775457,139.637709032),
new google.maps.LatLng(35.463834627,139.635775541),
new google.maps.LatLng(35.4659210600001,139.63388632),
new google.maps.LatLng(35.468034119,139.632041945),
new google.maps.LatLng(35.470173161,139.630242978),
new google.maps.LatLng(35.4723375340001,139.628489967),
new google.maps.LatLng(35.474526579,139.626783446),
new google.maps.LatLng(35.4767396300001,139.625123934),
new google.maps.LatLng(35.4789760120001,139.623511938),
new google.maps.LatLng(35.4812350440001,139.621947948),
new google.maps.LatLng(35.4835160380001,139.62043244),
new google.maps.LatLng(35.4858182980001,139.618965877),
new google.maps.LatLng(35.4881411250001,139.617548705),
new google.maps.LatLng(35.4904838100001,139.616181356),
new google.maps.LatLng(35.4906194440001,139.616122222),
new google.maps.LatLng(35.5341722220001,139.692497222),
new google.maps.LatLng(35.5348208240001,139.692268843),
new google.maps.LatLng(35.5357612350001,139.691949707),
new google.maps.LatLng(35.536706054,139.691650704),
new google.maps.LatLng(35.537654994,139.691371924),
new google.maps.LatLng(35.5386077650001,139.691113452),
new google.maps.LatLng(35.5395640780001,139.690875367),
new google.maps.LatLng(35.5405236400001,139.690657741),
new google.maps.LatLng(35.54148616,139.690460642),
new google.maps.LatLng(35.5424513450001,139.690284128),
new google.maps.LatLng(35.5434189,139.690128253),
new google.maps.LatLng(35.544388531,139.689993066),
new google.maps.LatLng(35.5453599420001,139.689878607),
new google.maps.LatLng(35.5463328380001,139.689784912),
new google.maps.LatLng(35.5473069220001,139.689712008),
new google.maps.LatLng(35.548281897,139.689659917),
new google.maps.LatLng(35.5492574660001,139.689628657),
new google.maps.LatLng(35.5502333330001,139.689618236),
new google.maps.LatLng(35.5512092,139.689628657),
new google.maps.LatLng(35.5521847700001,139.689659917),
new google.maps.LatLng(35.5531597450001,139.689712008),
new google.maps.LatLng(35.5541338290001,139.689784912),
new google.maps.LatLng(35.5551067250001,139.689878607),
new google.maps.LatLng(35.5560781360001,139.689993066),
new google.maps.LatLng(35.5570477670001,139.690128253),
new google.maps.LatLng(35.5580153220001,139.690284128),
new google.maps.LatLng(35.5589805060001,139.690460642),
new google.maps.LatLng(35.5599430270001,139.690657741),
new google.maps.LatLng(35.5609025890001,139.690875367),
new google.maps.LatLng(35.5618589010001,139.691113452),
new google.maps.LatLng(35.5628116730001,139.691371924),
new google.maps.LatLng(35.5637606130001,139.691650704),
new google.maps.LatLng(35.564705432,139.691949707),
new google.maps.LatLng(35.5656458430001,139.692268843),
new google.maps.LatLng(35.566581559,139.692608014),
new google.maps.LatLng(35.5675122950001,139.692967117),
new google.maps.LatLng(35.5677916670001,139.693055556),
new google.maps.LatLng(35.5684391890001,139.692568966),
new google.maps.LatLng(35.569564723,139.691724957),
new google.maps.LatLng(35.5707021220001,139.690905113),
new google.maps.LatLng(35.5718510410001,139.690109685),
new google.maps.LatLng(35.5730111300001,139.689338914),
new google.maps.LatLng(35.574182034,139.688593036),
new google.maps.LatLng(35.575363398,139.687872278),
new google.maps.LatLng(35.5765548620001,139.687176859),
new google.maps.LatLng(35.577756063,139.686506991),
new google.maps.LatLng(35.578966634,139.685862878),
new google.maps.LatLng(35.580186208,139.685244717),
new google.maps.LatLng(35.5814144120001,139.684652695),
new google.maps.LatLng(35.582650872,139.684086994),
new google.maps.LatLng(35.5838952130001,139.683547784),
new google.maps.LatLng(35.5851470540001,139.683035231),
new google.maps.LatLng(35.5864060140001,139.682549491),
new google.maps.LatLng(35.587671711,139.682090712),
new google.maps.LatLng(35.5889437580001,139.681659033),
new google.maps.LatLng(35.590221768,139.681254585),
new google.maps.LatLng(35.5915053510001,139.680877493),
new google.maps.LatLng(35.5927941180001,139.680527871),
new google.maps.LatLng(35.594087674,139.680205825),
new google.maps.LatLng(35.5953856260001,139.679911454),
new google.maps.LatLng(35.596687579,139.679644847),
new google.maps.LatLng(35.5979931360001,139.679406086),
new google.maps.LatLng(35.5993019,139.679195243),
new google.maps.LatLng(35.6006134710001,139.679012382),
new google.maps.LatLng(35.6019274510001,139.678857559),
new google.maps.LatLng(35.603243438,139.678730821),
new google.maps.LatLng(35.604561033,139.678632207),
new google.maps.LatLng(35.6058798330001,139.678561747),
new google.maps.LatLng(35.6071994380001,139.678519463),
new google.maps.LatLng(35.6085194440001,139.678505367),
new google.maps.LatLng(35.6098394510001,139.678519463),
new google.maps.LatLng(35.6111590550001,139.678561747),
new google.maps.LatLng(35.6124778560001,139.678632207),
new google.maps.LatLng(35.613795451,139.678730821),
new google.maps.LatLng(35.615111438,139.678857559),
new google.maps.LatLng(35.6164254180001,139.679012382),
new google.maps.LatLng(35.617736989,139.679195243),
new google.maps.LatLng(35.6190457530001,139.679406086),
new google.maps.LatLng(35.62035131,139.679644847),
new google.maps.LatLng(35.621653263,139.679911454),
new google.maps.LatLng(35.6229512150001,139.680205825),
new google.maps.LatLng(35.6242447710001,139.680527871),
new google.maps.LatLng(35.6255335380001,139.680877493),
new google.maps.LatLng(35.626817121,139.681254585),
new google.maps.LatLng(35.6280951310001,139.681659033),
new google.maps.LatLng(35.6293671780001,139.682090712),
new google.maps.LatLng(35.6306328750001,139.682549491),
new google.maps.LatLng(35.6318918350001,139.683035231),
new google.maps.LatLng(35.6331436760001,139.683547784),
new google.maps.LatLng(35.634388017,139.684086994),
new google.maps.LatLng(35.6356244770001,139.684652695),
new google.maps.LatLng(35.6368526810001,139.685244717),
new google.maps.LatLng(35.6380722550001,139.685862878),
new google.maps.LatLng(35.6392828260001,139.686506991),
new google.maps.LatLng(35.6404840270001,139.687176859),
new google.maps.LatLng(35.6410732269288,139.687505722046),
new google.maps.LatLng(35.6456966400148,139.683042526245),
new google.maps.LatLng(35.6474056243898,139.679391860962),
new google.maps.LatLng(35.6476116180419,139.678949356079),
new google.maps.LatLng(35.6478252410889,139.678506851196),
new google.maps.LatLng(35.6480388641359,139.678071975708),
new google.maps.LatLng(35.6482601165772,139.677633285522),
new google.maps.LatLng(35.6484775543212,139.677202224731),
new google.maps.LatLng(35.6487026214601,139.676767349243),
new google.maps.LatLng(35.6489276885987,139.676343917847),
new google.maps.LatLng(35.6491603851318,139.675912857056),
new google.maps.LatLng(35.6493892669678,139.675497055054),
new google.maps.LatLng(35.6496257781985,139.67506980896),
new google.maps.LatLng(35.6498622894287,139.674657821655),
new google.maps.LatLng(35.6501064300537,139.674238204956),
new google.maps.LatLng(35.6503467559814,139.673833847046),
new google.maps.LatLng(35.650598526001,139.673418045044),
new google.maps.LatLng(35.650842666626,139.673017501831),
new google.maps.LatLng(35.6510982513429,139.672609329224),
new google.maps.LatLng(35.6513500213625,139.672216415406),
new google.maps.LatLng(35.6516094207765,139.671812057495),
new google.maps.LatLng(35.6518650054931,139.671426773071),
new google.maps.LatLng(35.6521320343019,139.671026229858),
new google.maps.LatLng(35.6523952484131,139.670648574829),
new google.maps.LatLng(35.6526660919189,139.670255661011),
new google.maps.LatLng(35.6529331207276,139.669881820679),
new google.maps.LatLng(35.6532115936279,139.669492721558),
new google.maps.LatLng(35.6534786224366,139.66912651062),
new google.maps.LatLng(35.6537647247316,139.668745040894),
new google.maps.LatLng(35.6540393829347,139.668386459351),
new google.maps.LatLng(35.6543292999269,139.668012619019),
new google.maps.LatLng(35.6546077728272,139.667657852173),
new google.maps.LatLng(35.6549015045167,139.667287826538),
new google.maps.LatLng(35.6551837921144,139.666940689087),
new google.maps.LatLng(35.6554851531984,139.666578292847),
new google.maps.LatLng(35.6557712554933,139.66623878479),
new google.maps.LatLng(35.6560764312745,139.665884017944),
new google.maps.LatLng(35.6563663482667,139.665552139282),
new google.maps.LatLng(35.6566791534423,139.665201187134),
new google.maps.LatLng(35.6569728851318,139.664876937866),
new google.maps.LatLng(35.6572895050051,139.664533615112),
new google.maps.LatLng(35.6575870513915,139.664213180541),
new google.maps.LatLng(35.657907485962,139.663877487183),
new google.maps.LatLng(35.6582088470461,139.663568496704),
new google.maps.LatLng(35.6585330963136,139.663240432739),
new google.maps.LatLng(35.6588420867921,139.662935256958),
new google.maps.LatLng(35.6591701507571,139.66261100769),
new google.maps.LatLng(35.6594791412355,139.662313461304),
new google.maps.LatLng(35.6598148345948,139.662000656128),
new google.maps.LatLng(35.6601276397705,139.661710739136),
new google.maps.LatLng(35.6604671478272,139.661405563355),
new google.maps.LatLng(35.6607837677004,139.66111946106),
new google.maps.LatLng(35.6611232757568,139.660821914673),
new google.maps.LatLng(35.6614437103274,139.66054725647),
new google.maps.LatLng(35.6617908477783,139.66025352478),
new google.maps.LatLng(35.6621150970458,139.659986495972),
new google.maps.LatLng(35.6624660491944,139.659700393677),
new google.maps.LatLng(35.6627902984619,139.659440994263),
new google.maps.LatLng(35.6631450653077,139.659162521362),
new google.maps.LatLng(35.6634769439698,139.658910751343),
new google.maps.LatLng(35.6635458633749,139.658857893047),
new google.maps.LatLng(35.6682314784872,139.665498061114),
new google.maps.LatLng(35.6727286857105,139.672543577809),
new google.maps.LatLng(35.6769379420862,139.679851807372),
new google.maps.LatLng(35.680849061661,139.687405103755),
new google.maps.LatLng(35.6844525785148,139.695185219598),
new google.maps.LatLng(35.6877397699864,139.703173350679),
new google.maps.LatLng(35.6907026780933,139.711350181801),
new google.maps.LatLng(35.6933341290778,139.719695934014),
new google.maps.LatLng(35.695627751041,139.72819041304),
new google.maps.LatLng(35.6966663606132,139.733573595737),
new google.maps.LatLng(35.696668733503,139.733590384391),
new google.maps.LatLng(35.6777095794677,139.733675003052),
new google.maps.LatLng(35.6781415020001,139.734895008),
new google.maps.LatLng(35.6786466660001,139.736387382),
new google.maps.LatLng(35.679130468,139.737890316),
new google.maps.LatLng(35.6795927620001,139.739403354),
new google.maps.LatLng(35.6800334060001,139.740926035),
new google.maps.LatLng(35.6804522660001,139.742457894),
new google.maps.LatLng(35.6808492150001,139.743998465),
new google.maps.LatLng(35.6812241310001,139.745547278),
new google.maps.LatLng(35.6815769010001,139.747103863),
new google.maps.LatLng(35.681907417,139.748667744),
new google.maps.LatLng(35.6822155780001,139.750238446),
new google.maps.LatLng(35.6825012910001,139.75181549),
new google.maps.LatLng(35.6827644680001,139.753398395),
new google.maps.LatLng(35.6830050290001,139.754986679),
new google.maps.LatLng(35.6832229010001,139.75657986),
new google.maps.LatLng(35.6834180180001,139.75817745),
new google.maps.LatLng(35.6835903200001,139.759778964),
new google.maps.LatLng(35.6837397550001,139.761383914),
new google.maps.LatLng(35.683866277,139.762991811),
new google.maps.LatLng(35.6839698470001,139.764602165),
new google.maps.LatLng(35.6840504350001,139.766214485),
new google.maps.LatLng(35.684108015,139.767828281),
new google.maps.LatLng(35.6841425700001,139.769443061),
new google.maps.LatLng(35.6841540890001,139.771058333),
new google.maps.LatLng(35.6841425700001,139.772673605),
new google.maps.LatLng(35.684108015,139.774288385),
new google.maps.LatLng(35.6840504350001,139.775902181),
new google.maps.LatLng(35.6839698470001,139.777514502),
new google.maps.LatLng(35.683866277,139.779124856),
new google.maps.LatLng(35.6837397550001,139.780732753),
new google.maps.LatLng(35.6835903200001,139.782337703),
new google.maps.LatLng(35.6834180180001,139.783939217),
new google.maps.LatLng(35.683341667,139.784727778)
	];

	//切欠(円錐表面) 設定
	var landingKi_setting = {
		paths         : landingKi,
		strokeColor   : "#000000",
		strokeOpacity : 0.7,
		strokeWeight  : 0.5,
		fillColor     : "#000000",
		fillOpacity   : 0.05,
		zIndex        : 105
	};

	//切欠(円錐表面) 地図表示
	landingKi_obj = new google.maps.Polygon(landingKi_setting);
	landingKi_obj.setMap(map);

	//-------------------------------------------------------------------------------

	//切欠(外側水平表面) 座標パス
	var landingKi_s = [
new google.maps.LatLng(35.6977694440001,139.824425),
new google.maps.LatLng(35.6982364290001,139.82204767),
new google.maps.LatLng(35.6987982040001,139.818946849),
new google.maps.LatLng(35.699315669,139.815834504),
new google.maps.LatLng(35.6997886660001,139.81271158),
new google.maps.LatLng(35.7002170520001,139.809579032),
new google.maps.LatLng(35.700600695,139.806437811),
new google.maps.LatLng(35.70093948,139.803288876),
new google.maps.LatLng(35.701233302,139.800133185),
new google.maps.LatLng(35.7014820720001,139.7969717),
new google.maps.LatLng(35.7016857150001,139.793805384),
new google.maps.LatLng(35.7018472220001,139.790780556),
new google.maps.LatLng(35.683341667,139.784727778),
new google.maps.LatLng(35.6834180180001,139.783939217),
new google.maps.LatLng(35.6835903200001,139.782337703),
new google.maps.LatLng(35.6837397550001,139.780732753),
new google.maps.LatLng(35.683866277,139.779124856),
new google.maps.LatLng(35.6839698470001,139.777514502),
new google.maps.LatLng(35.6840504350001,139.775902181),
new google.maps.LatLng(35.684108015,139.774288385),
new google.maps.LatLng(35.6841425700001,139.772673605),
new google.maps.LatLng(35.6841540890001,139.771058333),
new google.maps.LatLng(35.6841425700001,139.769443061),
new google.maps.LatLng(35.684108015,139.767828281),
new google.maps.LatLng(35.6840504350001,139.766214485),
new google.maps.LatLng(35.6839698470001,139.764602165),
new google.maps.LatLng(35.683866277,139.762991811),
new google.maps.LatLng(35.6837397550001,139.761383914),
new google.maps.LatLng(35.6835903200001,139.759778964),
new google.maps.LatLng(35.6834180180001,139.75817745),
new google.maps.LatLng(35.6832229010001,139.75657986),
new google.maps.LatLng(35.6830050290001,139.754986679),
new google.maps.LatLng(35.6827644680001,139.753398395),
new google.maps.LatLng(35.6825012910001,139.75181549),
new google.maps.LatLng(35.6822155780001,139.750238446),
new google.maps.LatLng(35.681907417,139.748667744),
new google.maps.LatLng(35.6815769010001,139.747103863),
new google.maps.LatLng(35.6812241310001,139.745547278),
new google.maps.LatLng(35.6808492150001,139.743998465),
new google.maps.LatLng(35.6804522660001,139.742457894),
new google.maps.LatLng(35.6800334060001,139.740926035),
new google.maps.LatLng(35.6795927620001,139.739403354),
new google.maps.LatLng(35.679130468,139.737890316),
new google.maps.LatLng(35.6786466660001,139.736387382),
new google.maps.LatLng(35.6781415020001,139.734895008),
new google.maps.LatLng(35.6777095794677,139.733675003052),
new google.maps.LatLng(35.696668733503,139.733590384391),
new google.maps.LatLng(35.7093334198,139.733533859253),
new google.maps.LatLng(35.7488040924072,139.741949081421),
new google.maps.LatLng(35.7686328887939,139.755918502808),
new google.maps.LatLng(35.768014907837,139.748704910278),
new google.maps.LatLng(35.7667560577393,139.737989425659),
new google.maps.LatLng(35.7651424407961,139.727346420288),
new google.maps.LatLng(35.7631740570069,139.716791152954),
new google.maps.LatLng(35.7608547210694,139.706342697144),
new google.maps.LatLng(35.7581882476808,139.69602394104),
new google.maps.LatLng(35.7551822662354,139.685846328736),
new google.maps.LatLng(35.7518367767335,139.675825119019),
new google.maps.LatLng(35.7481632232667,139.665983200073),
new google.maps.LatLng(35.7441654205323,139.656335830689),
new google.maps.LatLng(35.7398471832275,139.646894454956),
new google.maps.LatLng(35.735216140747,139.637678146363),
new google.maps.LatLng(35.7302837371827,139.628705978394),
new google.maps.LatLng(35.7250576019287,139.619985580444),
new google.maps.LatLng(35.7195415496826,139.611536026001),
new google.maps.LatLng(35.7137508392335,139.603372573853),
new google.maps.LatLng(35.7076930999755,139.595502853394),
new google.maps.LatLng(35.703733444214,139.590738296509),
new google.maps.LatLng(35.7003536224368,139.598192214966),
new google.maps.LatLng(35.7000904083253,139.598501205444),
new google.maps.LatLng(35.6997013092043,139.598966598511),
new google.maps.LatLng(35.6994419097902,139.599279403687),
new google.maps.LatLng(35.6990604400636,139.599756240845),
new google.maps.LatLng(35.6988048553467,139.600076675415),
new google.maps.LatLng(35.6984272003175,139.600561141968),
new google.maps.LatLng(35.6981792449951,139.600885391235),
new google.maps.LatLng(35.6978092193604,139.601377487183),
new google.maps.LatLng(35.6975650787354,139.601709365845),
new google.maps.LatLng(35.6971988677979,139.602209091187),
new google.maps.LatLng(35.6969585418702,139.602548599243),
new google.maps.LatLng(35.6965999603271,139.603055953979),
new google.maps.LatLng(35.6963672637939,139.603399276734),
new google.maps.LatLng(35.6960124969484,139.603918075562),
new google.maps.LatLng(35.6957836151125,139.604265213013),
new google.maps.LatLng(35.6954402923585,139.604791641236),
new google.maps.LatLng(35.6952152252197,139.605142593384),
new google.maps.LatLng(35.694875717163,139.605676651001),
new google.maps.LatLng(35.6946544647217,139.606035232544),
new google.maps.LatLng(35.6943264007569,139.606576919556),
new google.maps.LatLng(35.6941089630129,139.606939315796),
new google.maps.LatLng(35.6937847137451,139.6074924469),
new google.maps.LatLng(35.6935749053956,139.60785484314),
new google.maps.LatLng(35.6932582855225,139.608415603638),
new google.maps.LatLng(35.6930561065675,139.608785629272),
new google.maps.LatLng(35.6927471160889,139.609354019165),
new google.maps.LatLng(35.6925449371338,139.609727859497),
new google.maps.LatLng(35.6922435760497,139.610303878784),
new google.maps.LatLng(35.6920490264893,139.610681533814),
new google.maps.LatLng(35.6917552947999,139.611265182495),
new google.maps.LatLng(35.6915683746339,139.611646652222),
new google.maps.LatLng(35.691282272339,139.612237930298),
new google.maps.LatLng(35.6822032928467,139.631685256958),
new google.maps.LatLng(35.6720714569094,139.653371810913),
new google.maps.LatLng(35.6719112396241,139.653440475464),
new google.maps.LatLng(35.6715335845948,139.653608322144),
new google.maps.LatLng(35.6711597442628,139.653787612915),
new google.maps.LatLng(35.6707897186282,139.653970718384),
new google.maps.LatLng(35.6704235076907,139.654165267944),
new google.maps.LatLng(35.670057296753,139.654363632202),
new google.maps.LatLng(35.6696910858155,139.654569625854),
new google.maps.LatLng(35.6693325042726,139.654783248901),
new google.maps.LatLng(35.6689739227294,139.65500831604),
new google.maps.LatLng(35.6686191558838,139.655237197876),
new google.maps.LatLng(35.6682682037353,139.655469894409),
new google.maps.LatLng(35.6679210662842,139.655714035034),
new google.maps.LatLng(35.6644802093506,139.658170700073),
new google.maps.LatLng(35.6641674041747,139.658395767212),
new google.maps.LatLng(35.6638355255129,139.658639907837),
new google.maps.LatLng(35.6635458633749,139.658857893047),
new google.maps.LatLng(35.6635458633749,139.658857893047),
new google.maps.LatLng(35.6682314784872,139.665498061114),
new google.maps.LatLng(35.6727286857105,139.672543577809),
new google.maps.LatLng(35.6769379420862,139.679851807372),
new google.maps.LatLng(35.680849061661,139.687405103755),
new google.maps.LatLng(35.6844525785148,139.695185219598),
new google.maps.LatLng(35.6877397699864,139.703173350679),
new google.maps.LatLng(35.6907026780933,139.711350181801),
new google.maps.LatLng(35.6933341290778,139.719695934014),
new google.maps.LatLng(35.695627751041,139.72819041304),
new google.maps.LatLng(35.6966663606132,139.733573595737),
new google.maps.LatLng(35.696668733503,139.733590384391),
new google.maps.LatLng(35.6777095794677,139.733675003052),
new google.maps.LatLng(35.6781415020001,139.734895008),
new google.maps.LatLng(35.6786466660001,139.736387382),
new google.maps.LatLng(35.679130468,139.737890316),
new google.maps.LatLng(35.6795927620001,139.739403354),
new google.maps.LatLng(35.6800334060001,139.740926035),
new google.maps.LatLng(35.6804522660001,139.742457894),
new google.maps.LatLng(35.6808492150001,139.743998465),
new google.maps.LatLng(35.6812241310001,139.745547278),
new google.maps.LatLng(35.6815769010001,139.747103863),
new google.maps.LatLng(35.681907417,139.748667744),
new google.maps.LatLng(35.6822155780001,139.750238446),
new google.maps.LatLng(35.6825012910001,139.75181549),
new google.maps.LatLng(35.6827644680001,139.753398395),
new google.maps.LatLng(35.6830050290001,139.754986679),
new google.maps.LatLng(35.6832229010001,139.75657986),
new google.maps.LatLng(35.6834180180001,139.75817745),
new google.maps.LatLng(35.6835903200001,139.759778964),
new google.maps.LatLng(35.6837397550001,139.761383914),
new google.maps.LatLng(35.683866277,139.762991811),
new google.maps.LatLng(35.6839698470001,139.764602165),
new google.maps.LatLng(35.6840504350001,139.766214485),
new google.maps.LatLng(35.684108015,139.767828281),
new google.maps.LatLng(35.6841425700001,139.769443061),
new google.maps.LatLng(35.6841540890001,139.771058333),
new google.maps.LatLng(35.6841425700001,139.772673605),
new google.maps.LatLng(35.684108015,139.774288385),
new google.maps.LatLng(35.6840504350001,139.775902181),
new google.maps.LatLng(35.6839698470001,139.777514502),
new google.maps.LatLng(35.683866277,139.779124856),
new google.maps.LatLng(35.6837397550001,139.780732753),
new google.maps.LatLng(35.6835903200001,139.782337703),
new google.maps.LatLng(35.6834180180001,139.783939217),
new google.maps.LatLng(35.683341667,139.784727778),
new google.maps.LatLng(35.7018472220001,139.790780556),
new google.maps.LatLng(35.7016857150001,139.793805384),
new google.maps.LatLng(35.7014820720001,139.7969717),
new google.maps.LatLng(35.701233302,139.800133185),
new google.maps.LatLng(35.70093948,139.803288876),
new google.maps.LatLng(35.700600695,139.806437811),
new google.maps.LatLng(35.7002170520001,139.809579032),
new google.maps.LatLng(35.6997886660001,139.81271158),
new google.maps.LatLng(35.699315669,139.815834504),
new google.maps.LatLng(35.6987982040001,139.818946849),
new google.maps.LatLng(35.6982364290001,139.82204767),
new google.maps.LatLng(35.6977694440001,139.824425),
new google.maps.LatLng(35.6976305160001,139.825136021),
new google.maps.LatLng(35.6969806470001,139.828210962),
new google.maps.LatLng(35.6962870230001,139.831271556),
new google.maps.LatLng(35.695549853,139.83431687),
new google.maps.LatLng(35.694769363,139.837345977),
new google.maps.LatLng(35.69394579,139.840357955),
new google.maps.LatLng(35.6930793860001,139.843351886),
new google.maps.LatLng(35.692170413,139.846326857),
new google.maps.LatLng(35.6912191490001,139.849281963),
new google.maps.LatLng(35.6902258840001,139.852216303),
new google.maps.LatLng(35.68919092,139.855128985),
new google.maps.LatLng(35.6881145720001,139.858019119),
new google.maps.LatLng(35.6869971690001,139.860885827),
new google.maps.LatLng(35.6858390500001,139.863728234),
new google.maps.LatLng(35.6846405690001,139.866545476),
new google.maps.LatLng(35.6834020910001,139.869336693),
new google.maps.LatLng(35.6821239920001,139.872101036),
new google.maps.LatLng(35.6808066620001,139.874837663),
new google.maps.LatLng(35.6794505030001,139.877545739),
new google.maps.LatLng(35.6780559270001,139.880224441),
new google.maps.LatLng(35.6766233600001,139.882872952),
new google.maps.LatLng(35.6751532370001,139.885490465),
new google.maps.LatLng(35.6736460070001,139.888076183),
new google.maps.LatLng(35.6721021280001,139.890629319),
new google.maps.LatLng(35.6705220710001,139.893149094),
new google.maps.LatLng(35.6689063170001,139.895634742),
new google.maps.LatLng(35.6672553590001,139.898085504),
new google.maps.LatLng(35.6655696990001,139.900500635),
new google.maps.LatLng(35.6638498500001,139.902879399),
new google.maps.LatLng(35.6620963380001,139.905221071),
new google.maps.LatLng(35.6603096950001,139.907524937),
new google.maps.LatLng(35.658490466,139.909790297),
new google.maps.LatLng(35.6566392050001,139.91201646),
new google.maps.LatLng(35.654756476,139.914202748),
new google.maps.LatLng(35.652842852,139.916348495),
new google.maps.LatLng(35.6508989170001,139.918453048),
new google.maps.LatLng(35.6489252630001,139.920515764),
new google.maps.LatLng(35.6469224900001,139.922536017),
new google.maps.LatLng(35.6448912100001,139.92451319),
new google.maps.LatLng(35.642832039,139.926446682),
new google.maps.LatLng(35.640745607,139.928335903),
new google.maps.LatLng(35.6386325480001,139.930180277),
new google.maps.LatLng(35.6364935060001,139.931979244),
new google.maps.LatLng(35.6343291330001,139.933732255),
new google.maps.LatLng(35.632140087,139.935438777),
new google.maps.LatLng(35.6299270370001,139.937098288),
new google.maps.LatLng(35.627690655,139.938710284),
new google.maps.LatLng(35.6254316230001,139.940274274),
new google.maps.LatLng(35.6231506290001,139.941789782),
new google.maps.LatLng(35.6208483680001,139.943256345),
new google.maps.LatLng(35.618525542,139.944673517),
new google.maps.LatLng(35.6161828570001,139.946040866),
new google.maps.LatLng(35.6138210280001,139.947357977),
new google.maps.LatLng(35.6114407730001,139.948624447),
new google.maps.LatLng(35.6090428190001,139.94983989),
new google.maps.LatLng(35.6066278950001,139.951003937),
new google.maps.LatLng(35.6041967370001,139.952116234),
new google.maps.LatLng(35.601750085,139.95317644),
new google.maps.LatLng(35.5992886850001,139.954184234),
new google.maps.LatLng(35.5968132870001,139.955139307),
new google.maps.LatLng(35.594324644,139.956041371),
new google.maps.LatLng(35.591823515,139.956890148),
new google.maps.LatLng(35.5893106620001,139.957685382),
new google.maps.LatLng(35.5867868490001,139.95842683),
new google.maps.LatLng(35.5842528460001,139.959114265),
new google.maps.LatLng(35.581709425,139.959747479),
new google.maps.LatLng(35.5791573600001,139.960326279),
new google.maps.LatLng(35.5765974290001,139.960850487),
new google.maps.LatLng(35.5740304110001,139.961319946),
new google.maps.LatLng(35.571457089,139.961734511),
new google.maps.LatLng(35.5688782460001,139.962094057),
new google.maps.LatLng(35.5662946680001,139.962398473),
new google.maps.LatLng(35.5637071420001,139.962647668),
new google.maps.LatLng(35.561116456,139.962841564),
new google.maps.LatLng(35.5585234,139.962980104),
new google.maps.LatLng(35.5559287620001,139.963063245),
new google.maps.LatLng(35.5533333330001,139.963090961),
new google.maps.LatLng(35.5507379050001,139.963063245),
new google.maps.LatLng(35.5481432670001,139.962980104),
new google.maps.LatLng(35.54555021,139.962841564),
new google.maps.LatLng(35.5429595240001,139.962647668),
new google.maps.LatLng(35.5403719980001,139.962398473),
new google.maps.LatLng(35.5377884200001,139.962094057),
new google.maps.LatLng(35.535209577,139.961734511),
new google.maps.LatLng(35.5326362550001,139.961319946),
new google.maps.LatLng(35.5300692380001,139.960850487),
new google.maps.LatLng(35.5275093070001,139.960326279),
new google.maps.LatLng(35.5249572420001,139.959747479),
new google.maps.LatLng(35.522413821,139.959114265),
new google.maps.LatLng(35.519879818,139.95842683),
new google.maps.LatLng(35.5173560050001,139.957685382),
new google.maps.LatLng(35.5148431520001,139.956890148),
new google.maps.LatLng(35.512342022,139.956041371),
new google.maps.LatLng(35.50985338,139.955139307),
new google.maps.LatLng(35.507377981,139.954184234),
new google.maps.LatLng(35.5049165820001,139.95317644),
new google.maps.LatLng(35.5024699300001,139.952116234),
new google.maps.LatLng(35.500038772,139.951003937),
new google.maps.LatLng(35.497623848,139.94983989),
new google.maps.LatLng(35.4952258930001,139.948624447),
new google.maps.LatLng(35.4928456390001,139.947357977),
new google.maps.LatLng(35.4904838100001,139.946040866),
new google.maps.LatLng(35.4881411250001,139.944673517),
new google.maps.LatLng(35.4858182980001,139.943256345),
new google.maps.LatLng(35.4835160380001,139.941789782),
new google.maps.LatLng(35.4812350440001,139.940274274),
new google.maps.LatLng(35.4789760120001,139.938710284),
new google.maps.LatLng(35.4767396300001,139.937098288),
new google.maps.LatLng(35.474526579,139.935438777),
new google.maps.LatLng(35.4723375340001,139.933732255),
new google.maps.LatLng(35.470173161,139.931979244),
new google.maps.LatLng(35.468034119,139.930180277),
new google.maps.LatLng(35.4659210600001,139.928335903),
new google.maps.LatLng(35.463834627,139.926446682),
new google.maps.LatLng(35.461775457,139.92451319),
new google.maps.LatLng(35.4597441760001,139.922536017),
new google.maps.LatLng(35.457741404,139.920515764),
new google.maps.LatLng(35.4557677490001,139.918453048),
new google.maps.LatLng(35.4538238140001,139.916348495),
new google.maps.LatLng(35.4519101910001,139.914202748),
new google.maps.LatLng(35.450027462,139.91201646),
new google.maps.LatLng(35.4481762010001,139.909790297),
new google.maps.LatLng(35.446356972,139.907524937),
new google.maps.LatLng(35.444570329,139.905221071),
new google.maps.LatLng(35.4428168160001,139.902879399),
new google.maps.LatLng(35.4410969680001,139.900500635),
new google.maps.LatLng(35.439411308,139.898085504),
new google.maps.LatLng(35.4377603490001,139.895634742),
new google.maps.LatLng(35.4361445960001,139.893149094),
new google.maps.LatLng(35.4345645390001,139.890629319),
new google.maps.LatLng(35.4330206600001,139.888076183),
new google.maps.LatLng(35.4315134300001,139.885490465),
new google.maps.LatLng(35.4300433070001,139.882872952),
new google.maps.LatLng(35.4286107400001,139.880224441),
new google.maps.LatLng(35.4272161640001,139.877545739),
new google.maps.LatLng(35.4258600050001,139.874837663),
new google.maps.LatLng(35.4245426750001,139.872101036),
new google.maps.LatLng(35.4232645760001,139.869336693),
new google.maps.LatLng(35.4220260980001,139.866545476),
new google.maps.LatLng(35.420827617,139.863728234),
new google.maps.LatLng(35.4196694980001,139.860885827),
new google.maps.LatLng(35.4185520950001,139.858019119),
new google.maps.LatLng(35.4174757470001,139.855128985),
new google.maps.LatLng(35.416440783,139.852216303),
new google.maps.LatLng(35.4154475180001,139.849281963),
new google.maps.LatLng(35.4144962540001,139.846326857),
new google.maps.LatLng(35.413587281,139.843351886),
new google.maps.LatLng(35.412720876,139.840357955),
new google.maps.LatLng(35.411897303,139.837345977),
new google.maps.LatLng(35.411116813,139.83431687),
new google.maps.LatLng(35.410379644,139.831271556),
new google.maps.LatLng(35.409686019,139.828210962),
new google.maps.LatLng(35.4090361510001,139.825136021),
new google.maps.LatLng(35.4084302370001,139.82204767),
new google.maps.LatLng(35.4078684620001,139.818946849),
new google.maps.LatLng(35.4073509980001,139.815834504),
new google.maps.LatLng(35.406878,139.81271158),
new google.maps.LatLng(35.406449615,139.809579032),
new google.maps.LatLng(35.4060659710001,139.806437811),
new google.maps.LatLng(35.4057271870001,139.803288876),
new google.maps.LatLng(35.4054333650001,139.800133185),
new google.maps.LatLng(35.405184595,139.7969717),
new google.maps.LatLng(35.4049809520001,139.793805384),
new google.maps.LatLng(35.404822499,139.790635201),
new google.maps.LatLng(35.404709284,139.787462116),
new google.maps.LatLng(35.4046413410001,139.784287097),
new google.maps.LatLng(35.4046186910001,139.781111111),
new google.maps.LatLng(35.4046413410001,139.777935125),
new google.maps.LatLng(35.404709284,139.774760106),
new google.maps.LatLng(35.404822499,139.771587022),
new google.maps.LatLng(35.4049809520001,139.768416838),
new google.maps.LatLng(35.405184595,139.765250522),
new google.maps.LatLng(35.4054333650001,139.762089037),
new google.maps.LatLng(35.4057271870001,139.758933346),
new google.maps.LatLng(35.4060659710001,139.755784411),
new google.maps.LatLng(35.406449615,139.752643191),
new google.maps.LatLng(35.406878,139.749510642),
new google.maps.LatLng(35.4073509980001,139.746387719),
new google.maps.LatLng(35.4078684620001,139.743275373),
new google.maps.LatLng(35.4084302370001,139.740174552),
new google.maps.LatLng(35.4090361510001,139.737086201),
new google.maps.LatLng(35.409686019,139.73401126),
new google.maps.LatLng(35.410379644,139.730950666),
new google.maps.LatLng(35.411116813,139.727905352),
new google.maps.LatLng(35.411897303,139.724876245),
new google.maps.LatLng(35.412720876,139.721864267),
new google.maps.LatLng(35.413587281,139.718870337),
new google.maps.LatLng(35.4144962540001,139.715895365),
new google.maps.LatLng(35.4154475180001,139.712940259),
new google.maps.LatLng(35.416440783,139.710005919),
new google.maps.LatLng(35.4174757470001,139.707093238),
new google.maps.LatLng(35.4185520950001,139.704203103),
new google.maps.LatLng(35.4196694980001,139.701336395),
new google.maps.LatLng(35.420827617,139.698493988),
new google.maps.LatLng(35.4220260980001,139.695676746),
new google.maps.LatLng(35.4232645760001,139.692885529),
new google.maps.LatLng(35.423697222,139.691952778),
new google.maps.LatLng(35.3615083330001,139.658669444),
new google.maps.LatLng(35.3605977450001,139.66094075),
new google.maps.LatLng(35.358913209,139.665075161),
new google.maps.LatLng(35.3572878950001,139.669244918),
new google.maps.LatLng(35.355722299,139.67344875),
new google.maps.LatLng(35.3542168970001,139.677685377),
new google.maps.LatLng(35.3527721470001,139.681953509),
new google.maps.LatLng(35.35138849,139.686251844),
new google.maps.LatLng(35.350066348,139.690579076),
new google.maps.LatLng(35.3488061230001,139.694933883),
new google.maps.LatLng(35.347608199,139.699314942),
new google.maps.LatLng(35.3464729410001,139.703720916),
new google.maps.LatLng(35.345400694,139.708150464),
new google.maps.LatLng(35.3443917860001,139.712602237),
new google.maps.LatLng(35.3434465230001,139.717074878),
new google.maps.LatLng(35.3425651940001,139.721567025),
new google.maps.LatLng(35.3417480670001,139.72607731),
new google.maps.LatLng(35.34099539,139.730604359),
new google.maps.LatLng(35.340307394,139.735146792),
new google.maps.LatLng(35.3396842880001,139.739703227),
new google.maps.LatLng(35.339126261,139.744272275),
new google.maps.LatLng(35.3386334840001,139.748852544),
new google.maps.LatLng(35.3382061070001,139.75344264),
new google.maps.LatLng(35.3378442590001,139.758041163),
new google.maps.LatLng(35.337548052,139.762646715),
new google.maps.LatLng(35.3373175740001,139.76725789),
new google.maps.LatLng(35.3371528970001,139.771873285),
new google.maps.LatLng(35.3370540710001,139.776491495),
new google.maps.LatLng(35.3370211260001,139.781111111),
new google.maps.LatLng(35.3370540710001,139.785730728),
new google.maps.LatLng(35.3371528970001,139.790348937),
new google.maps.LatLng(35.3373175740001,139.794964332),
new google.maps.LatLng(35.337548052,139.799575508),
new google.maps.LatLng(35.3378442590001,139.804181059),
new google.maps.LatLng(35.3382061070001,139.808779583),
new google.maps.LatLng(35.3386334840001,139.813369678),
new google.maps.LatLng(35.339126261,139.817949948),
new google.maps.LatLng(35.3396842880001,139.822518996),
new google.maps.LatLng(35.340307394,139.82707543),
new google.maps.LatLng(35.34099539,139.831617864),
new google.maps.LatLng(35.3417480670001,139.836144912),
new google.maps.LatLng(35.3425651940001,139.840655197),
new google.maps.LatLng(35.3434465230001,139.845147344),
new google.maps.LatLng(35.3443917860001,139.849619985),
new google.maps.LatLng(35.345400694,139.854071758),
new google.maps.LatLng(35.3464729410001,139.858501306),
new google.maps.LatLng(35.347608199,139.86290728),
new google.maps.LatLng(35.3488061230001,139.867288339),
new google.maps.LatLng(35.350066348,139.871643147),
new google.maps.LatLng(35.35138849,139.875970378),
new google.maps.LatLng(35.3527721470001,139.880268714),
new google.maps.LatLng(35.3542168970001,139.884536845),
new google.maps.LatLng(35.355722299,139.888773472),
new google.maps.LatLng(35.3572878950001,139.892977305),
new google.maps.LatLng(35.358913209,139.897147061),
new google.maps.LatLng(35.3605977450001,139.901281472),
new google.maps.LatLng(35.3623409900001,139.905379278),
new google.maps.LatLng(35.3641424140001,139.909439231),
new google.maps.LatLng(35.366001467,139.913460093),
new google.maps.LatLng(35.3679175820001,139.917440641),
new google.maps.LatLng(35.369890178,139.921379661),
new google.maps.LatLng(35.371918651,139.925275955),
new google.maps.LatLng(35.3740023860001,139.929128334),
new google.maps.LatLng(35.3761407460001,139.932935626),
new google.maps.LatLng(35.3783330810001,139.936696671),
new google.maps.LatLng(35.380578723,139.940410322),
new google.maps.LatLng(35.3828769880001,139.94407545),
new google.maps.LatLng(35.3852271750001,139.947690937),
new google.maps.LatLng(35.3876285690001,139.951255683),
new google.maps.LatLng(35.390080438,139.9547686),
new google.maps.LatLng(35.3925820360001,139.95822862),
new google.maps.LatLng(35.3951326,139.961634688),
new google.maps.LatLng(35.397731353,139.964985767),
new google.maps.LatLng(35.4003775050001,139.968280836),
new google.maps.LatLng(35.4030702480001,139.971518892),
new google.maps.LatLng(35.405808763,139.974698947),
new google.maps.LatLng(35.4085922150001,139.977820033),
new google.maps.LatLng(35.4114197570001,139.9808812),
new google.maps.LatLng(35.414290527,139.983881516),
new google.maps.LatLng(35.4172036500001,139.986820065),
new google.maps.LatLng(35.4201582410001,139.989695953),
new google.maps.LatLng(35.4231533970001,139.992508305),
new google.maps.LatLng(35.426188208,139.995256262),
new google.maps.LatLng(35.429261748,139.997938989),
new google.maps.LatLng(35.4323730820001,140.000555669),
new google.maps.LatLng(35.4355212610001,140.003105503),
new google.maps.LatLng(35.4387053280001,140.005587716),
new google.maps.LatLng(35.44192431,140.00800155),
new google.maps.LatLng(35.4451772300001,140.010346272),
new google.maps.LatLng(35.4484630940001,140.012621167),
new google.maps.LatLng(35.451780903,140.014825541),
new google.maps.LatLng(35.455129646,140.016958724),
new google.maps.LatLng(35.4585083030001,140.019020065),
new google.maps.LatLng(35.4619158440001,140.021008937),
new google.maps.LatLng(35.465351232,140.022924734),
new google.maps.LatLng(35.4688134200001,140.024766872),
new google.maps.LatLng(35.4723013540001,140.02653479),
new google.maps.LatLng(35.475813971,140.028227949),
new google.maps.LatLng(35.479350201,140.029845835),
new google.maps.LatLng(35.4829089670001,140.031387953),
new google.maps.LatLng(35.486489185,140.032853835),
new google.maps.LatLng(35.4900897640001,140.034243033),
new google.maps.LatLng(35.4937096080001,140.035555125),
new google.maps.LatLng(35.497347614,140.036789711),
new google.maps.LatLng(35.5010026740001,140.037946414),
new google.maps.LatLng(35.5046736740001,140.039024883),
new google.maps.LatLng(35.5083594970001,140.04002479),
new google.maps.LatLng(35.5120590180001,140.040945828),
new google.maps.LatLng(35.5157711130001,140.041787718),
new google.maps.LatLng(35.5194946490001,140.042550204),
new google.maps.LatLng(35.5232284930001,140.043233053),
new google.maps.LatLng(35.526971507,140.043836057),
new google.maps.LatLng(35.5307225510001,140.044359032),
new google.maps.LatLng(35.534480482,140.044801819),
new google.maps.LatLng(35.5382441570001,140.045164284),
new google.maps.LatLng(35.5420124270001,140.045446316),
new google.maps.LatLng(35.5457841460001,140.045647828),
new google.maps.LatLng(35.5495581650001,140.04576876),
new google.maps.LatLng(35.5533333330001,140.045809075),
new google.maps.LatLng(35.5571085020001,140.04576876),
new google.maps.LatLng(35.5608825210001,140.045647828),
new google.maps.LatLng(35.56465424,140.045446316),
new google.maps.LatLng(35.5684225100001,140.045164284),
new google.maps.LatLng(35.5721861840001,140.044801819),
new google.maps.LatLng(35.5759441160001,140.044359032),
new google.maps.LatLng(35.5796951600001,140.043836057),
new google.maps.LatLng(35.583438174,140.043233053),
new google.maps.LatLng(35.587172018,140.042550204),
new google.maps.LatLng(35.590895554,140.041787718),
new google.maps.LatLng(35.5946076480001,140.040945828),
new google.maps.LatLng(35.5983071700001,140.04002479),
new google.maps.LatLng(35.6019929920001,140.039024883),
new google.maps.LatLng(35.6056639930001,140.037946414),
new google.maps.LatLng(35.609319052,140.036789711),
new google.maps.LatLng(35.6129570580001,140.035555125),
new google.maps.LatLng(35.6165769020001,140.034243033),
new google.maps.LatLng(35.6201774820001,140.032853835),
new google.maps.LatLng(35.6237577,140.031387953),
new google.maps.LatLng(35.6273164660001,140.029845835),
new google.maps.LatLng(35.630852696,140.028227949),
new google.maps.LatLng(35.6343653120001,140.02653479),
new google.maps.LatLng(35.6378532460001,140.024766872),
new google.maps.LatLng(35.641315434,140.022924734),
new google.maps.LatLng(35.644750822,140.021008937),
new google.maps.LatLng(35.648158364,140.019020065),
new google.maps.LatLng(35.65153702,140.016958724),
new google.maps.LatLng(35.654885763,140.014825541),
new google.maps.LatLng(35.658203572,140.012621167),
new google.maps.LatLng(35.6614894370001,140.010346272),
new google.maps.LatLng(35.664742356,140.00800155),
new google.maps.LatLng(35.667961339,140.005587716),
new google.maps.LatLng(35.6711454050001,140.003105503),
new google.maps.LatLng(35.674293585,140.000555669),
new google.maps.LatLng(35.677404918,139.997938989),
new google.maps.LatLng(35.6804784590001,139.995256262),
new google.maps.LatLng(35.6835132690001,139.992508305),
new google.maps.LatLng(35.686508426,139.989695953),
new google.maps.LatLng(35.689463016,139.986820065),
new google.maps.LatLng(35.6923761400001,139.983881516),
new google.maps.LatLng(35.69524691,139.9808812),
new google.maps.LatLng(35.6980744520001,139.977820033),
new google.maps.LatLng(35.7008579040001,139.974698947),
new google.maps.LatLng(35.7035964190001,139.971518892),
new google.maps.LatLng(35.7062891620001,139.968280836),
new google.maps.LatLng(35.708935313,139.964985767),
new google.maps.LatLng(35.7115340670001,139.961634688),
new google.maps.LatLng(35.714084631,139.95822862),
new google.maps.LatLng(35.7165862290001,139.9547686),
new google.maps.LatLng(35.7190380980001,139.951255683),
new google.maps.LatLng(35.7214394920001,139.947690937),
new google.maps.LatLng(35.723789679,139.94407545),
new google.maps.LatLng(35.726087943,139.940410322),
new google.maps.LatLng(35.7283335850001,139.936696671),
new google.maps.LatLng(35.73052592,139.932935626),
new google.maps.LatLng(35.732664281,139.929128334),
new google.maps.LatLng(35.734748015,139.925275955),
new google.maps.LatLng(35.7367764890001,139.921379661),
new google.maps.LatLng(35.7387490840001,139.917440641),
new google.maps.LatLng(35.7406652,139.913460093),
new google.maps.LatLng(35.7425242530001,139.909439231),
new google.maps.LatLng(35.7443256760001,139.905379278),
new google.maps.LatLng(35.7460689210001,139.901281472),
new google.maps.LatLng(35.747753458,139.897147061),
new google.maps.LatLng(35.7493787710001,139.892977305),
new google.maps.LatLng(35.750944368,139.888773472),
new google.maps.LatLng(35.7524497700001,139.884536845),
new google.maps.LatLng(35.7538945200001,139.880268714),
new google.maps.LatLng(35.755278176,139.875970378),
new google.maps.LatLng(35.756600318,139.871643147),
new google.maps.LatLng(35.757860544,139.867288339),
new google.maps.LatLng(35.759058468,139.86290728),
new google.maps.LatLng(35.7601937260001,139.858501306),
new google.maps.LatLng(35.761265973,139.854071758),
new google.maps.LatLng(35.7622748810001,139.849619985),
new google.maps.LatLng(35.7632201440001,139.845147344),
new google.maps.LatLng(35.764101473,139.840655197),
new google.maps.LatLng(35.7649186,139.836144912),
new google.maps.LatLng(35.765671276,139.831617864),
new google.maps.LatLng(35.766359272,139.82707543),
new google.maps.LatLng(35.7668888890001,139.823538889),
new google.maps.LatLng(35.7608472220001,139.818605556),
new google.maps.LatLng(35.6977694440001,139.824425)
	];

	//切欠(外側円錐表面) 設定
	var landingKi_s_setting = {
		paths         : landingKi_s,
		strokeColor   : "#000000",
		strokeOpacity : 0.7,
		strokeWeight  : 0.5,
		fillColor     : "#000000",
		fillOpacity   : 0.05,
		zIndex        : 106
	};

	//切欠(外側円錐表面) 地図表示
	landingKi_s_obj = new google.maps.Polygon(landingKi_s_setting);
	landingKi_s_obj.setMap(map);

	//-------------------------------------------------------------------------------

	//水平表面
	var s_surface_setting = {
		center        : new google.maps.LatLng(35.55325248, 139.78122849),
		radius        : 4000,
		map           : map,
		strokeColor   : "#00FF00",
		strokeOpacity : 0.7,
		strokeWeight  : 1.0,
		fillColor     : "#00FF00",
		fillOpacity   : 0.05,
		zIndex        : 107
	};
	var s_surface_obj = new google.maps.Circle(s_surface_setting);


	//円錐表面（一時的に出力）
	var test_ensui = {
		center        : new google.maps.LatLng(35.55325248, 139.78122849),
		radius        : 16536,
		map           : map,
		strokeColor   : "#f1b71d",
		strokeOpacity : 0.7,
		strokeWeight  : 1.0,
		fillColor     : "#f1b71d",
		fillOpacity   : 0.05,
		zIndex        : 108
	};
	//var test_ensui_obj = new google.maps.Circle(test_ensui);

	//外側水平表面（一時的に出力）
	var test_sotogawa = {
		center        : new google.maps.LatLng(35.55325248, 139.78122849),
		radius        : 24000,
		map           : map,
		strokeColor   : "#8000ff",
		strokeOpacity : 0.7,
		strokeWeight  : 1.0,
		fillColor     : "#8000ff",
		fillOpacity   : 0.05,
		zIndex        : 109
	};
	//var test_sotogawa_obj = new google.maps.Circle(test_sotogawa);



	//-------------------------------------------------------------------------------

	//空港標点からの直線表示設定
	var polyOptions = {
		path          : [latlng],
		strokeColor   : '#000000',
		strokeOpacity : 0.7,
		strokeWeight  : 0.5
	}
	poly = new google.maps.Polyline(polyOptions);
	poly.setMap(map);

	//-------------------------------------------------------------------------------

	//各ポリゴンのクリックイベント
	google.maps.event.addListener(s_surface_obj, 'click', s_surface_event);		 //水平表面
	google.maps.event.addListener(landingKi_obj, 'click', Kikkake_event);		 //切欠座標(円錐表面)
	google.maps.event.addListener(landingKi_s_obj, 'click', Kikkake_s_event);	 //切欠座標(外側水平表面)

	//-------------------------------------------------------------------------------

	//制限表面範囲外の処理
	google.maps.event.addListener(map, 'click', function(event) {

		if (c_flg == 0) {
			return false;
		}

		//マーカー
		marker2.setPosition(event.latLng);
		marker2.setMap(map);

		//空港標点からの線
		var path = poly.getPath();
		path.removeAt(1);
		path.push(event.latLng);

		//逆ジオコーディング
		var strAdd = getAddress(event.latLng, 2);
		$("#ok").css("display", "none");
		$("#ng").css("display", "block");

		$("#t").val(0);
		$("#lt").val(event.latLng.lat().toFixed(8));
		$("#lg").val(event.latLng.lng().toFixed(8));

		//座標を表示【一時的】
		//$("#lltest2").html(event.latLng.lat().toFixed(8)+", "+event.latLng.lng().toFixed(8));

		$('#print').attr('disabled', false);
		$('#print').removeAttr('disabled');
	});
}


//-----------------------------------------------
//  切欠座標クリックイベント
//-----------------------------------------------
function Kikkake_event(event) {

	if (c_flg == 0) {
		return false;
	}

	//クリックされた箇所にマーカーを設置
	marker2.setPosition(event.latLng);
	marker2.setMap(map);

	//標点から線を引く
	var path = poly.getPath();
	path.removeAt(1);
	path.push(event.latLng);

	//空港標点からの距離を求める(m)
	var kyori = google.maps.geometry.spherical.computeDistanceBetween(marker1.getPosition(), event.latLng);

	//ソート用
	var height = [];

	//円錐表面の高さを取得
	var h_ensui     = math_ensui(kyori);
	var h_ensui_str = "円錐表面";
	//console.log(h_ensui_str+'='+h_ensui);

//---------------------------------------------------------------------------------------------------------------------------------------------------------
	if (h_ensui > 301.4) {
		h_ensui = 301.4;
	}
	height.push({val:h_ensui, str:h_ensui_str});
//---------------------------------------------------------------------------------------------------------------------------------------------------------

	//包含判定-----------------------------------------------------------

	//A滑走路：進入表面北側
	var a_sin1_flg = chk_Inclusion(mpA.cd01, mpA.cd03, mpA.cd07, event.latLng);
	var a_sin2_flg = chk_Inclusion(mpA.cd03, mpA.cd07, mpA.cd09, event.latLng);

	if (a_sin1_flg == true || a_sin2_flg == true) {

		var h_a_sin_str = "進入表面";
		var h_a_sin     = math_sinnyu(mpA.cd08, mpA.cd02, event.latLng, 6.1);
		//console.log(h_a_sin);
		height.push({val:h_a_sin, str:h_a_sin_str});
	}

	//A滑走路：進入表面南側 12,14,18,20
	var a_sin_s1_flg = chk_Inclusion(mpA.cd12, mpA.cd14, mpA.cd18, event.latLng);
	var a_sin_s2_flg = chk_Inclusion(mpA.cd14, mpA.cd18, mpA.cd20, event.latLng);

	if (a_sin_s1_flg == true || a_sin_s2_flg == true) {

		var h_a_sin_s_str = "進入表面";
		var h_a_sin_s     = math_sinnyu(mpA.cd13, mpA.cd19, event.latLng, 6.2);
		//console.log(h_a_sin_s);
		height.push({val:h_a_sin_s, str:h_a_sin_s_str});
	}

	//A滑走路：転移表面b（南東側） 11,12,16
	var a_ten_nbs_flg = chk_Inclusion(mpA.cd11, mpA.cd12, mpA.cd16, event.latLng);
	if (a_ten_nbs_flg == true) {

		var h_a_ten_nbs     = 9999;
		var h_a_ten_nbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpA.cd13, mpA.cd19, event.latLng, 6.2);

		//転移表面の高さを取得
		h_a_ten_nbs = math_tennib(mpA.cd13, mpA.cd19, mpA.cd12, mpA.cd18, event.latLng, hm0);
		//console.log(h_a_ten_nbs);
		height.push({val:h_a_ten_nbs, str:h_a_ten_nbs_str});
	}

	//A滑走路：転移表面b（南東側） 14,15,17
	var a_ten_sbs_flg = chk_Inclusion(mpA.cd14, mpA.cd15, mpA.cd17, event.latLng);
	if (a_ten_sbs_flg == true) {

		var h_a_ten_sbs     = 9999;
		var h_a_ten_sbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpA.cd13, mpA.cd19, event.latLng, 6.2);

		//転移表面の高さを取得
		h_a_ten_sbs = math_tennib(mpA.cd13, mpA.cd19, mpA.cd14, mpA.cd20, event.latLng, hm0);
		//console.log(h_a_ten_sbs);
		height.push({val:h_a_ten_sbs, str:h_a_ten_sbs_str});
	}

	//A滑走路：延長進入表面 18,20,21,23
	var a_sin_e1_flg = chk_Inclusion(mpA.cd18, mpA.cd20, mpA.cd21, event.latLng);
	var a_sin_e2_flg = chk_Inclusion(mpA.cd20, mpA.cd21, mpA.cd23, event.latLng);

	var h_a_sin_e     = 9999;
	var h_a_sin_e_str = "延長進入表面";
	if (a_sin_e1_flg == true || a_sin_e2_flg == true) {

		h_a_sin_e = math_sinnyu(mpA.cd13, mpA.cd22, event.latLng, 6.2);
		//console.log(h_a_sin_e);
		height.push({val:h_a_sin_e, str:h_a_sin_e_str});
	}


	//---------------------------


	//B滑走路：進入表面南側 1,3,7,9
	var b_sin1_flg = chk_Inclusion(mpB.cd01, mpB.cd03, mpB.cd07, event.latLng);
	var b_sin2_flg = chk_Inclusion(mpB.cd03, mpB.cd07, mpB.cd09, event.latLng);

	if (b_sin1_flg == true || b_sin2_flg == true) {

		var h_b_sin_str = "進入表面";
		var h_b_sin     = math_sinnyu(mpB.cd08, mpB.cd02, event.latLng, 5.8);
		//console.log(h_b_sin);
		height.push({val:h_b_sin, str:h_b_sin_str});
	}

	//B滑走路：転移表面b（南西側） 4,6,7
	var b_ten_nbu_flg = chk_Inclusion(mpB.cd04, mpB.cd06, mpB.cd07, event.latLng);
	if (b_ten_nbu_flg == true) {

		var h_b_ten_nbu     = 9999;
		var h_b_ten_nbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpB.cd08, mpB.cd02, event.latLng, 5.8);

		//転移表面の高さを取得
		h_b_ten_nbu = math_tennib(mpB.cd08, mpB.cd02, mpB.cd07, mpB.cd01, event.latLng, hm0);
		//console.log(h_b_ten_nbu);
		height.push({val:h_b_ten_nbu, str:h_b_ten_nbu_str});
	}

	//B滑走路：進入表面北側 12,14,18,20
	var b_sin_s1_flg = chk_Inclusion(mpB.cd12, mpB.cd14, mpB.cd18, event.latLng);
	var b_sin_s2_flg = chk_Inclusion(mpB.cd14, mpB.cd18, mpB.cd20, event.latLng);

	if (b_sin_s1_flg == true || b_sin_s2_flg == true) {

		var h_b_sin_s_str = "進入表面";
		var h_b_sin_s     = math_sinnyu(mpB.cd13, mpB.cd19, event.latLng, 10.7);
		//console.log(h_b_sin_s);
		height.push({val:h_b_sin_s, str:h_b_sin_s_str});
	}

	//B滑走路：延長進入表面 18,20,21,23
	var b_sin_e1_flg = chk_Inclusion(mpB.cd18, mpB.cd20, mpB.cd21, event.latLng);
	var b_sin_e2_flg = chk_Inclusion(mpB.cd20, mpB.cd21, mpB.cd23, event.latLng);

	var h_b_sin_e     = 9999;
	var h_b_sin_e_str = "延長進入表面";
	if (b_sin_e1_flg == true || b_sin_e2_flg == true) {

		h_b_sin_e = math_sinnyu(mpB.cd13, mpB.cd22, event.latLng, 10.7);
		//console.log(h_b_sin_e);
		height.push({val:h_b_sin_e, str:h_b_sin_e_str});
	}


	//---------------------------


	//C滑走路：進入表面北側 1,3,7,9
	var c_sin1_flg = chk_Inclusion(mpC.cd01, mpC.cd03, mpC.cd07, event.latLng);
	var c_sin2_flg = chk_Inclusion(mpC.cd03, mpC.cd07, mpC.cd09, event.latLng);

	if (c_sin1_flg == true || c_sin2_flg == true) {

		var h_c_sin_str = "進入表面";
		var h_c_sin     = math_sinnyu(mpC.cd08, mpC.cd02, event.latLng, 6.6);
		//console.log(h_c_sin);
		height.push({val:h_c_sin, str:h_c_sin_str});
	}

	//C滑走路：転移表面b（南東側） 11,12,16
	var c_ten_nbs_flg = chk_Inclusion(mpC.cd11, mpC.cd12, mpC.cd16, event.latLng);
	if (c_ten_nbs_flg == true) {

		var h_c_ten_nbs     = 9999;
		var h_c_ten_nbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpC.cd13, mpC.cd19, event.latLng, 8.5);

		//転移表面の高さを取得
		h_c_ten_nbs = math_tennib(mpC.cd13, mpC.cd19, mpC.cd12, mpC.cd18, event.latLng, hm0);
		//console.log(h_c_ten_nbs);
		height.push({val:h_c_ten_nbs, str:h_c_ten_nbs_str});
	}

	//C滑走路：転移表面b（南東側） 14,15,17
	var c_ten_sbs_flg = chk_Inclusion(mpC.cd14, mpC.cd15, mpC.cd17, event.latLng);
	if (c_ten_sbs_flg == true) {

		var h_c_ten_sbs     = 9999;
		var h_c_ten_sbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpC.cd13, mpC.cd19, event.latLng, 8.5);

		//転移表面の高さを取得
		h_c_ten_sbs = math_tennib(mpC.cd13, mpC.cd19, mpC.cd14, mpC.cd20, event.latLng, hm0);
		//console.log(h_c_ten_sbs);
		height.push({val:h_c_ten_sbs, str:h_c_ten_sbs_str});
	}

	//C滑走路：進入表面南側 12,14,18,20
	var c_sin_s1_flg = chk_Inclusion(mpC.cd12, mpC.cd14, mpC.cd18, event.latLng);
	var c_sin_s2_flg = chk_Inclusion(mpC.cd14, mpC.cd18, mpC.cd20, event.latLng);

	if (c_sin_s1_flg == true || c_sin_s2_flg == true) {

		var h_c_sin_s_str = "進入表面";
		var h_c_sin_s     = math_sinnyu(mpC.cd13, mpC.cd19, event.latLng, 8.5);
		//console.log(h_c_sin_s);
		height.push({val:h_c_sin_s, str:h_c_sin_s_str});
	}

	//C滑走路：延長進入表面 18,20,21,23
	var c_sin_e1_flg = chk_Inclusion(mpC.cd18, mpC.cd20, mpC.cd21, event.latLng);
	var c_sin_e2_flg = chk_Inclusion(mpC.cd20, mpC.cd21, mpC.cd23, event.latLng);

	var h_c_sin_e     = 9999;
	var h_c_sin_e_str = "延長進入表面";
	if (c_sin_e1_flg == true || c_sin_e2_flg == true) {

		h_c_sin_e = math_sinnyu(mpC.cd13, mpC.cd22, event.latLng, 8.5);
		//console.log(h_c_sin_e);
		height.push({val:h_c_sin_e, str:h_c_sin_e_str});
	}


	//---------------------------


	//D滑走路：着陸帯 7,9,12,14
	var d_chaku1_flg = chk_Inclusion(mpD.cd07, mpD.cd09, mpD.cd12, event.latLng);
	var d_chaku2_flg = chk_Inclusion(mpD.cd09, mpD.cd12, mpD.cd14, event.latLng);

	if (d_chaku1_flg == true || d_chaku2_flg == true) {

		var h_d_chaku     = 0;
		var h_d_chaku_str = "着陸帯";
		height.push({val:h_d_chaku, str:h_d_chaku_str});
	}

	//D滑走路：進入表面南側 1,3,7,9
	var d_sin1_flg = chk_Inclusion(mpD.cd01, mpD.cd03, mpD.cd07, event.latLng);
	var d_sin2_flg = chk_Inclusion(mpD.cd03, mpD.cd07, mpD.cd09, event.latLng);

	if (d_sin1_flg == true || d_sin2_flg == true) {

		var h_d_sin_str = "進入表面";
		var h_d_sin     = math_sinnyu(mpD.cd08, mpD.cd02, event.latLng, 13.866);
		//console.log(h_d_sin);
		height.push({val:h_d_sin, str:h_d_sin_str});
	}

	//D滑走路：転移表面a（着陸帯に面している南側）9,10,14,15
	var d_ten_s1_flg = chk_Inclusion(mpD.cd09, mpD.cd10, mpD.cd14, event.latLng);
	var d_ten_s2_flg = chk_Inclusion(mpD.cd10, mpD.cd14, mpD.cd15, event.latLng);
	if (d_ten_s1_flg == true || d_ten_s2_flg == true) {

		var h_d_ten_sd_str = "転移表面";
		var h_d_ten_sa     = math_tennia(mpD.cd08, mpD.cd13, 13.866, 15.966, event.latLng, 2620, 300);
		//console.log(h_d_ten_sa);
		height.push({val:h_d_ten_sa, str:h_d_ten_sd_str});
	}

	//D滑走路：転移表面b（南西側） 4,6,7
	var d_ten_nbu_flg = chk_Inclusion(mpD.cd04, mpD.cd06, mpD.cd07, event.latLng);
	if (d_ten_nbu_flg == true) {

		var h_d_ten_nbu     = 9999;
		var h_d_ten_nbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpD.cd08, mpD.cd02, event.latLng, 13.866);

		//転移表面の高さを取得
		h_d_ten_nbu = math_tennib(mpD.cd08, mpD.cd02, mpD.cd07, mpD.cd01, event.latLng, hm0);
		//console.log(h_d_ten_nbu);
		height.push({val:h_d_ten_nbu, str:h_d_ten_nbu_str});
	}

	//D滑走路：転移表面b（南西側） 5,9,10
	var d_ten_sbu_flg = chk_Inclusion(mpD.cd05, mpD.cd09, mpD.cd10, event.latLng);
	if (d_ten_sbu_flg == true) {

		var h_d_ten_sbu     = 9999;
		var h_d_ten_sbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpD.cd08, mpD.cd02, event.latLng, 13.866);

		//転移表面の高さを取得
		h_d_ten_sbu = math_tennib(mpD.cd08, mpD.cd02, mpD.cd09, mpD.cd03, event.latLng, hm0);
		//console.log(h_d_ten_sbu);
		height.push({val:h_d_ten_sbu, str:h_d_ten_sbu_str});
	}

	//D滑走路：転移表面b（北東側） 11,12,16
	var d_ten_nbs_flg = chk_Inclusion(mpD.cd11, mpD.cd12, mpD.cd16, event.latLng);
	if (d_ten_nbs_flg == true) {

		var h_d_ten_nbs     = 9999;
		var h_d_ten_nbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpD.cd13, mpD.cd19, event.latLng, 15.966);

		//転移表面の高さを取得
		h_d_ten_nbs = math_tennib(mpD.cd13, mpD.cd19, mpD.cd12, mpD.cd18, event.latLng, hm0);
		//console.log(h_d_ten_nbs);
		height.push({val:h_d_ten_nbs, str:h_d_ten_nbs_str});
	}

	//D滑走路：転移表面b（南東側） 14,15,17
	var d_ten_sbs_flg = chk_Inclusion(mpD.cd14, mpD.cd15, mpD.cd17, event.latLng);
	if (d_ten_sbs_flg == true) {

		var h_d_ten_sbs     = 9999;
		var h_d_ten_sbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpD.cd13, mpD.cd19, event.latLng, 15.966);

		//転移表面の高さを取得
		h_d_ten_sbs = math_tennib(mpD.cd13, mpD.cd19, mpD.cd14, mpD.cd20, event.latLng, hm0);
		//console.log(h_d_ten_sbs);
		height.push({val:h_d_ten_sbs, str:h_d_ten_sbs_str});
	}

	//D滑走路：進入表面北側 12,14,18,20
	var d_sin_s1_flg = chk_Inclusion(mpD.cd12, mpD.cd14, mpD.cd18, event.latLng);
	var d_sin_s2_flg = chk_Inclusion(mpD.cd14, mpD.cd18, mpD.cd20, event.latLng);

	if (d_sin_s1_flg == true || d_sin_s2_flg == true) {

		var h_d_sin_s_str = "進入表面";
		var h_d_sin_s     = math_sinnyu(mpD.cd13, mpD.cd19, event.latLng, 15.966);
		//console.log(h_d_sin_s);
		height.push({val:h_d_sin_s, str:h_d_sin_s_str});
	}

	//D滑走路：延長進入表面 18,20,21,23
	var d_sin_e1_flg = chk_Inclusion(mpD.cd18, mpD.cd20, mpD.cd21, event.latLng);
	var d_sin_e2_flg = chk_Inclusion(mpD.cd20, mpD.cd21, mpD.cd23, event.latLng);

	var h_d_sin_e     = 9999;
	var h_d_sin_e_str = "延長進入表面";
	if (d_sin_e1_flg == true || d_sin_e2_flg == true) {

		h_d_sin_e = math_sinnyu(mpD.cd13, mpD.cd22, event.latLng, 15.966);
		//console.log(h_d_sin_e_str+'=' +h_d_sin_e);
		height.push({val:h_d_sin_e, str:h_d_sin_e_str});
	}

	//高さの最小値を取得
	height.sort(function(a, b) {return a.val-b.val});
	var d = height.shift();

	var re_str = d.str;
	var re_val = d.val;

	//高さの高低問わず、円錐表面内と重なる進入表面は、進入表面と表示する
	if (a_sin1_flg == true || a_sin2_flg == true) {
		re_str = "進入表面";
	}
	if (a_sin_s1_flg == true || a_sin_s2_flg == true) {
		re_str = "進入表面";
	}
	if (b_sin1_flg == true || b_sin2_flg == true) {
		re_str = "進入表面";
	}
	if (b_sin_s1_flg == true || b_sin_s2_flg == true) {
		re_str = "進入表面";
	}
	if (c_sin1_flg == true || c_sin2_flg == true) {
		re_str = "進入表面";
	}
	if (c_sin_s1_flg == true || c_sin_s2_flg == true) {
		re_str = "進入表面";
	}
	if (d_sin1_flg == true || d_sin2_flg == true) {
		re_str = "進入表面";
	}
	if (d_sin_s1_flg == true || d_sin_s2_flg == true) {
		re_str = "進入表面";
	}

	//高さの高低問わず、円錐表面内と重なる延長進入表面は、その値を表示する
	if (a_sin_e1_flg == true || a_sin_e2_flg == true) {
		re_str = "延長進入表面";
	}
	if (b_sin_e1_flg == true || b_sin_e2_flg == true) {
		re_str = "延長進入表面";
	}
	if (c_sin_e1_flg == true || c_sin_e2_flg == true) {
		re_str = "延長進入表面";
	}
	if (d_sin_e1_flg == true || d_sin_e2_flg == true) {
		re_str = "延長進入表面";
	}

	//表示処理
	disp_value(event.latLng, re_str, re_val);

}

//-----------------------------------------------
//  外側水平上面表面のクリックイベント
//-----------------------------------------------
function Kikkake_s_event(event) {

	if (c_flg == 0) {
		return false;
	}

	//クリックされた箇所にマーカーを設置
	marker2.setPosition(event.latLng);
	marker2.setMap(map);

	//標点から線を引く
	var path = poly.getPath();
	path.removeAt(1);
	path.push(event.latLng);

	//ソート用
	var height = [];
	height.push({val:301.4, str:"外側水平表面"});

	//包含判定-----------------------------------------------------------

	//A滑走路：延長進入表面 18,20,21,23
	var a_sin_e1_flg = chk_Inclusion(mpA.cd18, mpA.cd20, mpA.cd21, event.latLng);
	var a_sin_e2_flg = chk_Inclusion(mpA.cd20, mpA.cd21, mpA.cd23, event.latLng);

	var h_a_sin_e     = 9999;
	var h_a_sin_e_str = "延長進入表面";
	if (a_sin_e1_flg == true || a_sin_e2_flg == true) {

		h_a_sin_e = math_sinnyu(mpA.cd13, mpA.cd22, event.latLng, 6.2);
		//console.log(h_a_sin_e);
		height.push({val:h_a_sin_e, str:h_a_sin_e_str});
	}

	//B滑走路：延長進入表面 18,20,21,23
	var b_sin_e1_flg = chk_Inclusion(mpB.cd18, mpB.cd20, mpB.cd21, event.latLng);
	var b_sin_e2_flg = chk_Inclusion(mpB.cd20, mpB.cd21, mpB.cd23, event.latLng);

	var h_b_sin_e     = 9999;
	var h_b_sin_e_str = "延長進入表面";
	if (b_sin_e1_flg == true || b_sin_e2_flg == true) {

		h_b_sin_e = math_sinnyu(mpB.cd13, mpB.cd22, event.latLng, 10.7);
		//console.log(h_b_sin_e);
		height.push({val:h_b_sin_e, str:h_b_sin_e_str});
	}

	//C滑走路：延長進入表面 18,20,21,23
	var c_sin_e1_flg = chk_Inclusion(mpC.cd18, mpC.cd20, mpC.cd21, event.latLng);
	var c_sin_e2_flg = chk_Inclusion(mpC.cd20, mpC.cd21, mpC.cd23, event.latLng);

	var h_c_sin_e     = 9999;
	var h_c_sin_e_str = "延長進入表面";
	if (c_sin_e1_flg == true || c_sin_e2_flg == true) {

		h_c_sin_e = math_sinnyu(mpC.cd13, mpC.cd22, event.latLng, 8.5);
		//console.log(h_c_sin_e);
		height.push({val:h_c_sin_e, str:h_c_sin_e_str});
	}

	//D滑走路：延長進入表面 18,20,21,23
	var d_sin_e1_flg = chk_Inclusion(mpD.cd18, mpD.cd20, mpD.cd21, event.latLng);
	var d_sin_e2_flg = chk_Inclusion(mpD.cd20, mpD.cd21, mpD.cd23, event.latLng);

	var h_d_sin_e     = 9999;
	var h_d_sin_e_str = "延長進入表面";
	if (d_sin_e1_flg == true || d_sin_e2_flg == true) {

		h_d_sin_e = math_sinnyu(mpD.cd13, mpD.cd22, event.latLng, 6.2);
		//console.log(h_d_sin_e);
		height.push({val:h_d_sin_e, str:h_d_sin_e_str});
	}

	//高さの最小値を取得
	height.sort(function(a, b) {return a.val-b.val});
	var d = height.shift();

	var re_str = d.str;
	var re_val = d.val;

	//高さの高低問わず、外側水平表面内と重なる延長進入表面は、その値を表示する
	if (a_sin_e1_flg == true || a_sin_e2_flg == true) {
		re_str = "延長進入表面";
	}
	if (b_sin_e1_flg == true || b_sin_e2_flg == true) {
		re_str = "延長進入表面";
	}
	if (c_sin_e1_flg == true || c_sin_e2_flg == true) {
		re_str = "延長進入表面";
	}
	if (d_sin_e1_flg == true || d_sin_e2_flg == true) {
		re_str = "延長進入表面";
	}

	//表示処理
	disp_value(event.latLng, re_str, re_val);

}
//-----------------------------------------------
//  水平表面のクリックイベント
//-----------------------------------------------
function s_surface_event(event) {

	if (c_flg == 0) {
		return false;
	}

	//クリックされた箇所にマーカーを設置
	marker2.setPosition(event.latLng);
	marker2.setMap(map);

	//標点から線を引く
	var path = poly.getPath();
	path.removeAt(1);
	path.push(event.latLng);

	//ソート用
	var height = [];

	//水平表面の高さ
	var h_suihei     = 51.4;
	var h_suihei_str = "水平表面";

	//height.push({val:h_suihei, str:h_suihei_str});
	//alert(h_suihei_str+"="+h_suihei);

	//包含判定-----------------------------------------------------------

	//A滑走路：着陸帯
	var a_chaku1_flg = chk_Inclusion(mpA.cd07, mpA.cd09, mpA.cd12, event.latLng);
	var a_chaku2_flg = chk_Inclusion(mpA.cd09, mpA.cd12, mpA.cd14, event.latLng);

	if (a_chaku1_flg == true || a_chaku2_flg == true) {

		var h_a_chaku     = 0;
		var h_a_chaku_str = "着陸帯";
		height.push({val:h_a_chaku, str:h_a_chaku_str});
	}

	//A滑走路：進入表面北側
	var a_sin1_flg = chk_Inclusion(mpA.cd01, mpA.cd03, mpA.cd07, event.latLng);
	var a_sin2_flg = chk_Inclusion(mpA.cd03, mpA.cd07, mpA.cd09, event.latLng);

	if (a_sin1_flg == true || a_sin2_flg == true) {

		var h_a_sin_str = "進入表面";
		var h_a_sin     = math_sinnyu(mpA.cd08, mpA.cd02, event.latLng, 6.1);
		//console.log(h_a_sin);
		height.push({val:h_a_sin, str:h_a_sin_str});
		h_suihei_str = h_a_sin_str;
	}

	//A滑走路：転移表面a（着陸帯に面している東側）6,7,11,12
	var a_ten_n1_flg = chk_Inclusion(mpA.cd06, mpA.cd07, mpA.cd11, event.latLng);
	var a_ten_n2_flg = chk_Inclusion(mpA.cd07, mpA.cd11, mpA.cd12, event.latLng);
	if (a_ten_n1_flg == true || a_ten_n2_flg == true) {

		var h_a_ten_na_str = "転移表面";
		var h_a_ten_na     = math_tennia(mpA.cd08, mpA.cd13, 6.1, 6.2, event.latLng, 3120, 300);
		//console.log(h_a_ten_na);
		height.push({val:h_a_ten_na, str:h_a_ten_na_str});
		h_suihei_str = h_a_ten_na_str;
	}

	//A滑走路：転移表面b（北西側） 4,6,7
	var a_ten_nbu_flg = chk_Inclusion(mpA.cd04, mpA.cd06, mpA.cd07, event.latLng);
	if (a_ten_nbu_flg == true) {

		var h_a_ten_nbu     = 9999;
		var h_a_ten_nbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpA.cd08, mpA.cd02, event.latLng, 6.1);

		//転移表面の高さを取得
		h_a_ten_nbu = math_tennib(mpA.cd08, mpA.cd02, mpA.cd07, mpA.cd01, event.latLng, hm0);
		//console.log(h_a_ten_nbu);
		height.push({val:h_a_ten_nbu, str:h_a_ten_nbu_str});
		h_suihei_str = h_a_ten_nbu_str;
	}

	//A滑走路：転移表面b（南東側） 11,12,16
	var a_ten_nbs_flg = chk_Inclusion(mpA.cd11, mpA.cd12, mpA.cd16, event.latLng);
	if (a_ten_nbs_flg == true) {

		var h_a_ten_nbs     = 9999;
		var h_a_ten_nbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpA.cd13, mpA.cd19, event.latLng, 6.2);

		//転移表面の高さを取得
		h_a_ten_nbs = math_tennib(mpA.cd13, mpA.cd19, mpA.cd12, mpA.cd18, event.latLng, hm0);
		//console.log(h_a_ten_nbs);
		height.push({val:h_a_ten_nbs, str:h_a_ten_nbs_str});
		h_suihei_str = h_a_ten_nbs_str;
	}

	//A滑走路：転移表面a（着陸帯に面している西側）9,10,14,15
	var a_ten_s1_flg = chk_Inclusion(mpA.cd09, mpA.cd10, mpA.cd14, event.latLng);
	var a_ten_s2_flg = chk_Inclusion(mpA.cd10, mpA.cd14, mpA.cd15, event.latLng);
	if (a_ten_s1_flg == true || a_ten_s2_flg == true) {

		var h_a_ten_sa_str = "転移表面";
		var h_a_ten_sa     = math_tennia(mpA.cd08, mpA.cd13, 6.1, 6.2, event.latLng, 3120, 300);
		//console.log(h_a_ten_sa);
		height.push({val:h_a_ten_sa, str:h_a_ten_sa_str});
		h_suihei_str = h_a_ten_sa_str;
	}

	//A滑走路：転移表面b（北西側） 5,9,10
	var a_ten_sbu_flg = chk_Inclusion(mpA.cd05, mpA.cd09, mpA.cd10, event.latLng);
	if (a_ten_sbu_flg == true) {

		var h_a_ten_sbu     = 9999;
		var h_a_ten_sbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpA.cd08, mpA.cd02, event.latLng, 6.1);

		//転移表面の高さを取得
		h_a_ten_sbu = math_tennib(mpA.cd08, mpA.cd02, mpA.cd09, mpA.cd03, event.latLng, hm0);
		//console.log(h_a_ten_sbu);
		height.push({val:h_a_ten_sbu, str:h_a_ten_sbu_str});
		h_suihei_str = h_a_ten_sbu_str;
	}

	//A滑走路：転移表面b（南東側） 14,15,17
	var a_ten_sbs_flg = chk_Inclusion(mpA.cd14, mpA.cd15, mpA.cd17, event.latLng);
	if (a_ten_sbs_flg == true) {

		var h_a_ten_sbs     = 9999;
		var h_a_ten_sbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpA.cd13, mpA.cd19, event.latLng, 6.2);

		//転移表面の高さを取得
		h_a_ten_sbs = math_tennib(mpA.cd13, mpA.cd19, mpA.cd14, mpA.cd20, event.latLng, hm0);
		//console.log(h_a_ten_sbs);
		height.push({val:h_a_ten_sbs, str:h_a_ten_sbs_str});
		h_suihei_str = h_a_ten_sbs_str;
	}

	//A滑走路：進入表面南側 12,14,18,20
	var a_sin_s1_flg = chk_Inclusion(mpA.cd12, mpA.cd14, mpA.cd18, event.latLng);
	var a_sin_s2_flg = chk_Inclusion(mpA.cd14, mpA.cd18, mpA.cd20, event.latLng);

	if (a_sin_s1_flg == true || a_sin_s2_flg == true) {

		var h_a_sin_s_str = "進入表面";
		var h_a_sin_s     = math_sinnyu(mpA.cd13, mpA.cd19, event.latLng, 6.2);
		//console.log(h_a_sin_s);
		height.push({val:h_a_sin_s, str:h_a_sin_s_str});
		h_suihei_str = h_a_sin_s_str;
	}

	//---------------------------


	//B滑走路：着陸帯 7,9,12,14
	var b_chaku1_flg = chk_Inclusion(mpB.cd07, mpB.cd09, mpB.cd12, event.latLng);
	var b_chaku2_flg = chk_Inclusion(mpB.cd09, mpB.cd12, mpB.cd14, event.latLng);

	if (b_chaku1_flg == true || b_chaku2_flg == true) {

		var h_b_chaku     = 0;
		var h_b_chaku_str = "着陸帯";
		height.push({val:h_b_chaku, str:h_b_chaku_str});
	}

	//B滑走路：進入表面南側 1,3,7,9
	var b_sin1_flg = chk_Inclusion(mpB.cd01, mpB.cd03, mpB.cd07, event.latLng);
	var b_sin2_flg = chk_Inclusion(mpB.cd03, mpB.cd07, mpB.cd09, event.latLng);

	if (b_sin1_flg == true || b_sin2_flg == true) {

		var h_b_sin_str = "進入表面";
		var h_b_sin     = math_sinnyu(mpB.cd08, mpB.cd02, event.latLng, 5.8);
		//console.log(h_b_sin);
		height.push({val:h_b_sin, str:h_b_sin_str});
		h_suihei_str = h_b_sin_str;
	}

	//B滑走路：転移表面a（着陸帯に面している北側）6,7,11,12
	var b_ten_n1_flg = chk_Inclusion(mpB.cd06, mpB.cd07, mpB.cd11, event.latLng);
	var b_ten_n2_flg = chk_Inclusion(mpB.cd07, mpB.cd11, mpB.cd12, event.latLng);
	if (b_ten_n1_flg == true || b_ten_n2_flg == true) {

		var h_b_ten_nb_str = "転移表面";
		var h_b_ten_na     = math_tennia(mpB.cd08, mpB.cd13, 5.8, 10.7, event.latLng, 2620, 300);
		//console.log(h_b_ten_na);
		height.push({val:h_b_ten_na, str:h_b_ten_nb_str});
		h_suihei_str = h_b_ten_nb_str;
	}

	//B滑走路：転移表面b（南西側） 4,6,7
	var b_ten_nbu_flg = chk_Inclusion(mpB.cd04, mpB.cd06, mpB.cd07, event.latLng);
	if (b_ten_nbu_flg == true) {

		var h_b_ten_nbu     = 9999;
		var h_b_ten_nbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpB.cd08, mpB.cd02, event.latLng, 5.8);

		//転移表面の高さを取得
		h_b_ten_nbu = math_tennib(mpB.cd08, mpB.cd02, mpB.cd07, mpB.cd01, event.latLng, hm0);
		//console.log(h_b_ten_nbu);
		height.push({val:h_b_ten_nbu, str:h_b_ten_nbu_str});
		h_suihei_str = h_b_ten_nbu_str;
	}

	//B滑走路：転移表面b（北東側） 11,12,16
	var b_ten_nbs_flg = chk_Inclusion(mpB.cd11, mpB.cd12, mpB.cd16, event.latLng);
	if (b_ten_nbs_flg == true) {

		var h_b_ten_nbs     = 9999;
		var h_b_ten_nbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpB.cd13, mpB.cd19, event.latLng, 10.7);

		//転移表面の高さを取得
		h_b_ten_nbs = math_tennib(mpB.cd13, mpB.cd19, mpB.cd12, mpB.cd18, event.latLng, hm0);
		//console.log(h_b_ten_nbs);
		height.push({val:h_b_ten_nbs, str:h_b_ten_nbs_str});
		h_suihei_str = h_b_ten_nbs_str;
	}

	//B滑走路：転移表面a（着陸帯に面している南側）9,10,14,15
	var b_ten_s1_flg = chk_Inclusion(mpB.cd09, mpB.cd10, mpB.cd14, event.latLng);
	var b_ten_s2_flg = chk_Inclusion(mpB.cd10, mpB.cd14, mpB.cd15, event.latLng);
	if (b_ten_s1_flg == true || b_ten_s2_flg == true) {

		var h_b_ten_sb_str = "転移表面";
		var h_b_ten_sa     = math_tennia(mpB.cd08, mpB.cd13, 5.8, 10.7, event.latLng, 2620, 300);
		//console.log(h_b_ten_sa);
		height.push({val:h_b_ten_sa, str:h_b_ten_sb_str});
		h_suihei_str = h_b_ten_sb_str;
	}

	//B滑走路：転移表面b（南西側） 5,9,10
	var b_ten_sbu_flg = chk_Inclusion(mpB.cd05, mpB.cd09, mpB.cd10, event.latLng);
	if (b_ten_sbu_flg == true) {

		var h_b_ten_sbu     = 9999;
		var h_b_ten_sbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpB.cd08, mpB.cd02, event.latLng, 5.8);

		//転移表面の高さを取得
		h_b_ten_sbu = math_tennib(mpB.cd08, mpB.cd02, mpB.cd09, mpB.cd03, event.latLng, hm0);
		//console.log(h_b_ten_sbu);
		height.push({val:h_b_ten_sbu, str:h_b_ten_sbu_str});
		h_suihei_str = h_b_ten_sbu_str;
	}

	//B滑走路：転移表面b（北東側） 14,15,17
	var b_ten_sbs_flg = chk_Inclusion(mpB.cd14, mpB.cd15, mpB.cd17, event.latLng);
	if (b_ten_sbs_flg == true) {

		var h_b_ten_sbs     = 9999;
		var h_b_ten_sbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpB.cd13, mpB.cd19, event.latLng, 10.7);

		//転移表面の高さを取得
		h_b_ten_sbs = math_tennib(mpB.cd13, mpB.cd19, mpB.cd14, mpB.cd20, event.latLng, hm0);
		//console.log(h_b_ten_sbs);
		height.push({val:h_b_ten_sbs, str:h_b_ten_sbs_str});
		h_suihei_str = h_b_ten_sbs_str;
	}

	//B滑走路：進入表面北側 12,14,18,20
	var b_sin_s1_flg = chk_Inclusion(mpB.cd12, mpB.cd14, mpB.cd18, event.latLng);
	var b_sin_s2_flg = chk_Inclusion(mpB.cd14, mpB.cd18, mpB.cd20, event.latLng);

	if (b_sin_s1_flg == true || b_sin_s2_flg == true) {

		var h_b_sin_s_str = "進入表面";
		var h_b_sin_s     = math_sinnyu(mpB.cd13, mpB.cd19, event.latLng, 10.7);
		//console.log(h_b_sin_s);
		height.push({val:h_b_sin_s, str:h_b_sin_s_str});
		h_suihei_str = h_b_sin_s_str;
	}

	//---------------------------


	//C滑走路：着陸帯 7,9,12,14
	var c_chaku1_flg = chk_Inclusion(mpC.cd07, mpC.cd09, mpC.cd12, event.latLng);
	var c_chaku2_flg = chk_Inclusion(mpC.cd09, mpC.cd12, mpC.cd14, event.latLng);

	if (c_chaku1_flg == true || c_chaku2_flg == true) {

		var h_c_chaku     = 0;
		var h_c_chaku_str = "着陸帯";
		height.push({val:h_c_chaku, str:h_c_chaku_str});
	}

	//C滑走路：進入表面北側 1,3,7,9
	var c_sin1_flg = chk_Inclusion(mpC.cd01, mpC.cd03, mpC.cd07, event.latLng);
	var c_sin2_flg = chk_Inclusion(mpC.cd03, mpC.cd07, mpC.cd09, event.latLng);

	if (c_sin1_flg == true || c_sin2_flg == true) {

		var h_c_sin_str = "進入表面";
		var h_c_sin     = math_sinnyu(mpC.cd08, mpC.cd02, event.latLng, 6.6);
		//console.log(h_c_sin);
		height.push({val:h_c_sin, str:h_c_sin_str});
		h_suihei_str = h_c_sin_str;
	}

	//C滑走路：転移表面a（着陸帯に面している東側）6,7,11,12
	var c_ten_n1_flg = chk_Inclusion(mpC.cd06, mpC.cd07, mpC.cd11, event.latLng);
	var c_ten_n2_flg = chk_Inclusion(mpC.cd07, mpC.cd11, mpC.cd12, event.latLng);
	if (c_ten_n1_flg == true || c_ten_n2_flg == true) {

		var h_c_ten_nc_str = "転移表面";
		var h_c_ten_na     = math_tennia(mpC.cd08, mpC.cd13, 6.6, 8.5, event.latLng, 3480, 300);
		//console.log(h_c_ten_na);
		height.push({val:h_c_ten_na, str:h_c_ten_nc_str});
		h_suihei_str = h_c_ten_nc_str;
	}

	//C滑走路：転移表面b（北西側） 4,6,7
	var c_ten_nbu_flg = chk_Inclusion(mpC.cd04, mpC.cd06, mpC.cd07, event.latLng);
	if (c_ten_nbu_flg == true) {

		var h_c_ten_nbu     = 9999;
		var h_c_ten_nbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpC.cd08, mpC.cd02, event.latLng, 6.6);

		//転移表面の高さを取得
		h_c_ten_nbu = math_tennib(mpC.cd08, mpC.cd02, mpC.cd07, mpC.cd01, event.latLng, hm0);
		//console.log(h_c_ten_nbu);
		height.push({val:h_c_ten_nbu, str:h_c_ten_nbu_str});
		h_suihei_str = h_c_ten_nbu_str;
	}

	//C滑走路：転移表面b（南東側） 11,12,16
	var c_ten_nbs_flg = chk_Inclusion(mpC.cd11, mpC.cd12, mpC.cd16, event.latLng);
	if (c_ten_nbs_flg == true) {

		var h_c_ten_nbs     = 9999;
		var h_c_ten_nbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpC.cd13, mpC.cd19, event.latLng, 8.5);

		//転移表面の高さを取得
		h_c_ten_nbs = math_tennib(mpC.cd13, mpC.cd19, mpC.cd12, mpC.cd18, event.latLng, hm0);
		//console.log(h_c_ten_nbs);
		height.push({val:h_c_ten_nbs, str:h_c_ten_nbs_str});
		h_suihei_str = h_c_ten_nbs_str;
	}

	//C滑走路：転移表面a（着陸帯に面している西側）9,10,14,15
	var c_ten_s1_flg = chk_Inclusion(mpC.cd09, mpC.cd10, mpC.cd14, event.latLng);
	var c_ten_s2_flg = chk_Inclusion(mpC.cd10, mpC.cd14, mpC.cd15, event.latLng);
	if (c_ten_s1_flg == true || c_ten_s2_flg == true) {

		var h_c_ten_sc_str = "転移表面";
		var h_c_ten_sa     = math_tennia(mpC.cd08, mpC.cd13, 6.6, 8.5, event.latLng, 3480, 300);
		//console.log(h_c_ten_sa);
		height.push({val:h_c_ten_sa, str:h_c_ten_sc_str});
		h_suihei_str = h_c_ten_sc_str;
	}

	//C滑走路：転移表面b（北西側） 5,9,10
	var c_ten_sbu_flg = chk_Inclusion(mpC.cd05, mpC.cd09, mpC.cd10, event.latLng);
	if (c_ten_sbu_flg == true) {

		var h_c_ten_sbu     = 9999;
		var h_c_ten_sbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpC.cd08, mpC.cd02, event.latLng, 6.6);

		//転移表面の高さを取得
		h_c_ten_sbu = math_tennib(mpC.cd08, mpC.cd02, mpC.cd09, mpC.cd03, event.latLng, hm0);
		//console.log(h_c_ten_sbu);
		height.push({val:h_c_ten_sbu, str:h_c_ten_sbu_str});
		h_suihei_str = h_c_ten_sbu_str;
	}

	//C滑走路：転移表面b（南東側） 14,15,17
	var c_ten_sbs_flg = chk_Inclusion(mpC.cd14, mpC.cd15, mpC.cd17, event.latLng);
	if (c_ten_sbs_flg == true) {

		var h_c_ten_sbs     = 9999;
		var h_c_ten_sbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpC.cd13, mpC.cd19, event.latLng, 8.5);

		//転移表面の高さを取得
		h_c_ten_sbs = math_tennib(mpC.cd13, mpC.cd19, mpC.cd14, mpC.cd20, event.latLng, hm0);
		//console.log(h_c_ten_sbs);
		height.push({val:h_c_ten_sbs, str:h_c_ten_sbs_str});
		h_suihei_str = h_c_ten_sbs_str;
	}

	//C滑走路：進入表面南側 12,14,18,20
	var c_sin_s1_flg = chk_Inclusion(mpC.cd12, mpC.cd14, mpC.cd18, event.latLng);
	var c_sin_s2_flg = chk_Inclusion(mpC.cd14, mpC.cd18, mpC.cd20, event.latLng);

	if (c_sin_s1_flg == true || c_sin_s2_flg == true) {

		var h_c_sin_s_str = "進入表面";
		var h_c_sin_s     = math_sinnyu(mpC.cd13, mpC.cd19, event.latLng, 8.5);
		//console.log(h_c_sin_s_str+'='+h_c_sin_s);
		height.push({val:h_c_sin_s, str:h_c_sin_s_str});
		h_suihei_str = h_c_sin_s_str;
	}

	//---------------------------


	//D滑走路：着陸帯 7,9,12,14
	var d_chaku1_flg = chk_Inclusion(mpD.cd07, mpD.cd09, mpD.cd12, event.latLng);
	var d_chaku2_flg = chk_Inclusion(mpD.cd09, mpD.cd12, mpD.cd14, event.latLng);

	if (d_chaku1_flg == true || d_chaku2_flg == true) {

		var h_d_chaku     = 0;
		var h_d_chaku_str = "着陸帯";
		height.push({val:h_d_chaku, str:h_d_chaku_str});
	}

	//D滑走路：進入表面南側 1,3,7,9
	var d_sin1_flg = chk_Inclusion(mpD.cd01, mpD.cd03, mpD.cd07, event.latLng);
	var d_sin2_flg = chk_Inclusion(mpD.cd03, mpD.cd07, mpD.cd09, event.latLng);

	if (d_sin1_flg == true || d_sin2_flg == true) {

		var h_d_sin_str = "進入表面";
		var h_d_sin     = math_sinnyu(mpD.cd08, mpD.cd02, event.latLng, 13.866);
		//console.log(h_d_sin);
		height.push({val:h_d_sin, str:h_d_sin_str});
		h_suihei_str = h_d_sin_str;
	}

	//D滑走路：転移表面a（着陸帯に面している北側）6,7,11,12
	var d_ten_n1_flg = chk_Inclusion(mpD.cd06, mpD.cd07, mpD.cd11, event.latLng);
	var d_ten_n2_flg = chk_Inclusion(mpD.cd07, mpD.cd11, mpD.cd12, event.latLng);
	if (d_ten_n1_flg == true || d_ten_n2_flg == true) {

		var h_d_ten_nd_str = "転移表面";
		var h_d_ten_na     = math_tennia(mpD.cd08, mpD.cd13, 13.866, 15.966, event.latLng, 2620, 300);
		//console.log(h_d_ten_nd_str+'='+h_d_ten_na);
		height.push({val:h_d_ten_na, str:h_d_ten_nd_str});
		h_suihei_str = h_d_ten_nd_str;
	}

	//D滑走路：転移表面b（南西側） 4,6,7
	var d_ten_nbu_flg = chk_Inclusion(mpD.cd04, mpD.cd06, mpD.cd07, event.latLng);
	if (d_ten_nbu_flg == true) {

		var h_d_ten_nbu     = 9999;
		var h_d_ten_nbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpD.cd08, mpD.cd02, event.latLng, 13.866);

		//転移表面の高さを取得
		h_d_ten_nbu = math_tennib(mpD.cd08, mpD.cd02, mpD.cd07, mpD.cd01, event.latLng, hm0);
		//console.log(h_d_ten_nbu);
		height.push({val:h_d_ten_nbu, str:h_d_ten_nbu_str});
		h_suihei_str = h_d_ten_nbu_str;
	}

	//D滑走路：転移表面b（北東側） 11,12,16
	var d_ten_nbs_flg = chk_Inclusion(mpD.cd11, mpD.cd12, mpD.cd16, event.latLng);
	if (d_ten_nbs_flg == true) {

		var h_d_ten_nbs     = 9999;
		var h_d_ten_nbs_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpD.cd13, mpD.cd19, event.latLng, 15.966);

		//転移表面の高さを取得
		h_d_ten_nbs = math_tennib(mpD.cd13, mpD.cd19, mpD.cd12, mpD.cd18, event.latLng, hm0);
		//console.log(h_d_ten_nbs);
		height.push({val:h_d_ten_nbs, str:h_d_ten_nbs_str});
		h_suihei_str = h_d_ten_nbs_str;
	}

	//D滑走路：転移表面a（着陸帯に面している南側）9,10,14,15
	var d_ten_s1_flg = chk_Inclusion(mpD.cd09, mpD.cd10, mpD.cd14, event.latLng);
	var d_ten_s2_flg = chk_Inclusion(mpD.cd10, mpD.cd14, mpD.cd15, event.latLng);
	if (d_ten_s1_flg == true || d_ten_s2_flg == true) {

		var h_d_ten_sd_str = "転移表面";
		var h_d_ten_sa     = math_tennia(mpD.cd08, mpD.cd13, 13.866, 15.966, event.latLng, 2620, 300);
		//console.log(h_d_ten_sa);
		height.push({val:h_d_ten_sa, str:h_d_ten_sd_str});
		h_suihei_str = h_d_ten_sd_str;
	}

	//D滑走路：転移表面b（南西側） 5,9,10
	var d_ten_sbu_flg = chk_Inclusion(mpD.cd05, mpD.cd09, mpD.cd10, event.latLng);
	if (d_ten_sbu_flg == true) {

		var h_d_ten_sbu     = 9999;
		var h_d_ten_sbu_str = "転移表面";

		//進入表面の高さを取得
		var hm0 = math_sinnyu(mpD.cd08, mpD.cd02, event.latLng, 13.866);

		//転移表面の高さを取得
		h_d_ten_sbu = math_tennib(mpD.cd08, mpD.cd02, mpD.cd09, mpD.cd03, event.latLng, hm0);
		//console.log(h_d_ten_sbu);
		height.push({val:h_d_ten_sbu, str:h_d_ten_sbu_str});
		h_suihei_str = h_d_ten_sbu_str;
	}

	//D滑走路：進入表面北側 12,14,18,20
	var d_sin_s1_flg = chk_Inclusion(mpD.cd12, mpD.cd14, mpD.cd18, event.latLng);
	var d_sin_s2_flg = chk_Inclusion(mpD.cd14, mpD.cd18, mpD.cd20, event.latLng);

	if (d_sin_s1_flg == true || d_sin_s2_flg == true) {

		var h_d_sin_s_str = "進入表面";
		var h_d_sin_s     = math_sinnyu(mpD.cd13, mpD.cd19, event.latLng, 15.966);
		//console.log(h_d_sin_s);
		height.push({val:h_d_sin_s, str:h_d_sin_s_str});
		h_suihei_str = h_d_sin_s_str;
	}


	//水平表面の高さと文字を最後にpush
	//その前に包含した時に表示文字を変更する
	height.push({val:h_suihei, str:h_suihei_str});

	//高さの最小値を取得
	height.sort(function(a, b) {return a.val-b.val});
	var d = height.shift();

	var re_str = d.str;
	var re_val = d.val;

	//表示順の影響で、再度表示文言をセット
	//着陸帯→進入表面→転移表面→延長進入表面→水平表面→円錐表面→外側水平表
	if (c_sin_s1_flg == true || c_sin_s2_flg == true) {
		re_str = "進入表面";
	}
	if (d_chaku1_flg == true || d_chaku2_flg == true) {

		re_str = "着陸帯";
	}

	//表示処理
	disp_value(event.latLng, re_str, re_val);
}


//-----------------------------------------------
//  表示処理
//-----------------------------------------------
function disp_value(latlng, seigen, tp) {

	//逆ジオコーディング
	var strAdd = getAddress(latlng, 1);

	var tpp;
	if (tp == 0 || tp == 57 || tp == 307) {
		tpp = tp + "m";
	} else {
		tpp = "約" + Math.floor(tp) + "m";
	}

	$("#seigen").html(seigen);
	$("#tp").html(tpp);

	$('#print').attr('disabled', false);
	$('#print').removeAttr('disabled');

	$("#ok").css("display", "block");
	$("#ng").css("display", "none");

	$("#t").val(1);
	$("#lt").val(latlng.lat().toFixed(8));
	$("#lg").val(latlng.lng().toFixed(8));
	$("#ta").val(tpp);
	$("#lb").val(seigen);

	//座標を表示【一時的】
	//$("#lltest").html(latlng.lat().toFixed(8)+", "+latlng.lng().toFixed(8));
	//$("#lltest2").html(latlng.lat().toFixed(8)+", "+latlng.lng().toFixed(8));

}

//-----------------------------------------------
//  進入表面の計算
//   chak_p  : 着陸帯端中心座標        lat,lngが入っているオブジェクト
//   sinn_p  : 進入表面長辺中心座標    <例> obj.lat obj.lng
//   click_p : クリックした座標
//   he      : 該当する進入表面が接する滑走路端の高さ
//-----------------------------------------------
function math_sinnyu(chak_p, sinn_p, click_p, he) {

	var chak_latlng = new google.maps.LatLng(chak_p.lat, chak_p.lng);
	var sinn_latlng = new google.maps.LatLng(sinn_p.lat, sinn_p.lng);

	//chak_p, sinn_pの方角を取得
	var d1 = google.maps.geometry.spherical.computeHeading(chak_latlng, sinn_latlng);

	//chak_p, click_pの方角を取得
	var d2 = google.maps.geometry.spherical.computeHeading(chak_latlng, click_p);

	//上記2つの角度差を求める（角度）
	var d  = Math.abs(d1 - d2);

	//chak_p, click_pの距離を求める
	var shahen = google.maps.geometry.spherical.computeDistanceBetween(chak_latlng, click_p);

	//直角三角形の公式 斜辺×cosθで底辺の距離を求める
	var teihen = shahen * Math.cos(d * (Math.PI / 180));

	//進入表面の公式
	var h = he + teihen * (1/50);
	return h;
}

//-----------------------------------------------
//  転移表面の計算(a)
//   np  : 着陸帯端中心座標（北）        lat,lngが入っているオブジェクト
//   sp  : 着陸帯端中心座標（南）        <例> obj.lat obj.lng
//   nh  : 滑走路端の高さ（北）
//   sh  : 滑走路端の高さ（南）
//   cp  : クリックした座標
//   ta  : 着陸帯長
//   hb  : 着陸帯幅
//-----------------------------------------------
function math_tennia(np, sp, nh, sh, cp, ta, hb) {

	//着陸帯を底辺とした角度と底辺高さを求める
	var np_latlng = new google.maps.LatLng(np.lat, np.lng);
	var sp_latlng = new google.maps.LatLng(sp.lat, sp.lng);
	var d1        = google.maps.geometry.spherical.computeHeading(np_latlng, sp_latlng);
	var d2        = google.maps.geometry.spherical.computeHeading(np_latlng, cp);

	if (d2 < 0) {
		d2 = d2 + 180;
	}

	var kakudo    = Math.abs(d1 - d2);
	var shahen    = google.maps.geometry.spherical.computeDistanceBetween(np_latlng, cp);
	var teihen    = shahen * Math.cos(kakudo * (Math.PI / 180));
	var takasa    = shahen * Math.sin(kakudo * (Math.PI / 180));

	//console.log(np_latlng.lat());
	//console.log(np_latlng.lng());
	//console.log(shahen);

	
	var hm = nh + (sh - nh) * shahen / ta;
	var dm = takasa - (hb / 2);

	var h  = hm + dm * (1/7);

	return h;
}

//-----------------------------------------------
//  転移表面の計算(b)
//   p1  : 着陸帯端中心座標        lat,lngが入っているオブジェクト
//   p2  : 進入表面長辺中心座標    <例> obj.lat obj.lng
//   p3  : 該当する進入表面の着陸帯に接する座標
//   p4  : 該当する進入表面の長辺座標
//   cp  : クリックした座標
//   hm  : 転移表面が接する進入表面の高さ
//-----------------------------------------------
function math_tennib(p1, p2, p3, p4, cp, hm) {

	var p1y = Number(p1.lat);
	var p1x = Number(p1.lng);
	var p2y = Number(p2.lat);
	var p2x = Number(p2.lng);
	var p3y = Number(p3.lat);
	var p3x = Number(p3.lng);
	var p4y = Number(p4.lat);
	var p4x = Number(p4.lng);
	var p5y = Number(cp.lat().toFixed(8));
	var p5x = Number(cp.lng().toFixed(8));

	//(1)-----------------
	var p12_angle = (p2y - p1y) / (p2x - p1x);
	var p12_base  = -(p12_angle * p1x) + p1y;

	//(2)-----------------
	var p512_angle = -1 / p12_angle;
	var p512_base  = -(p512_angle * p5x) + p5y;

	//(3)-----------------
	var p34_angle = (p4y - p3y) / (p4x - p3x);
	var p34_base = -(p34_angle * p3x) + p3y;

	//(4)-----------------
	var xc = (p34_base - p512_base) / (p512_angle - p34_angle);
	var yc = p512_angle * xc + p512_base;

	var dm_p = new google.maps.LatLng(yc, xc);
	var dm   = google.maps.geometry.spherical.computeDistanceBetween(cp, dm_p);

	var h = hm + dm * (1/7);
	return h;
}

//-----------------------------------------------
//  円錐表面の計算
//-----------------------------------------------
function math_ensui(kyori) {

	var h = 6.4 + (kyori - 4000) * (1/50) + 45;
	return h;
}

//-----------------------------------------------
//  包含判定処理
//-----------------------------------------------
function chk_Inclusion(point1, point2, point3, click_point) {

	var p1 = new Object();
	var p2 = new Object();
	var p3 = new Object();
	var cp = new Object();

	p1.x = Number(point1.lat);
	p1.y = Number(point1.lng);
	p2.x = Number(point2.lat);
	p2.y = Number(point2.lng);
	p3.x = Number(point3.lat);
	p3.y = Number(point3.lng);
	cp.x = Number(click_point.lat().toFixed(8));
	cp.y = Number(click_point.lng().toFixed(8));

	var flg = PosIncludeTri(p1, p2, p3, cp);
	return flg;
}

//-----------------------------------------------
//  直線の交差判定
//-----------------------------------------------
function intersectM (p1, p2, p3, p4) {
	var x = ((p1.x - p2.x) * (p3.y - p1.y) + (p1.y - p2.y) * (p1.x - p3.x)) * ((p1.x - p2.x) * (p4.y - p1.y) + (p1.y - p2.y) * (p1.x - p4.x));
	return x;
}

//-----------------------------------------------
//  三角形の包含判定
//-----------------------------------------------
function PosIncludeTri (tp1, tp2, tp3, xp) {

	var c = new Object();
	c.x = (tp1.x + tp2.x + tp3.x) / 3;
	c.y = (tp1.y + tp2.y + tp3.y) / 3;

	chk1 = intersectM(tp1, tp2, xp, c);
	if (chk1 < 0) {
		return false
	} else {

		chk2 = intersectM(tp1, tp3, xp, c);
		if (chk2 < 0) {
			return false;
		} else {

			chk3 = intersectM(tp2, tp3, xp, c);
			if (chk3 < 0) {
				return false;
			}
		}
	}
	return true;
}

//-----------------------------------------------
//  ジオコーディング
//-----------------------------------------------
function getLatLng(place) {

	if (place == "") {
		return false;
	}

	c_flg = 1;

	//$('#map_canvas').css("pointer-events", "auto");
	//$('#map_canvas').css("cursor", "pointer");
	$('#print').attr('disabled', true);

	$("#ok").css("display", "none");
	$("#ng").css("display", "none");

        $("#init").css("display", "block" );                                                            //追加 　検索ボタン後は表示する

  //ジオコーダのコンストラクタ
  var geocoder = new google.maps.Geocoder();

  // geocodeリクエストを実行。
  // 第１引数はGeocoderRequest。住所⇒緯度経度座標の変換時はaddressプロパティを入れればOK。
  // 第２引数はコールバック関数。

	if (CheckInputLatLng(place) == true) {

		marker2.setMap(null);
		marker2 = new google.maps.Marker({
			position: gGoogleMapsLatLng,
			map: map
		});

		// 範囲を移動
		map.setCenter(gGoogleMapsLatLng);
		map.setZoom(20);

		// ポリラインのパスを取得
		var path = poly.getPath();
		path.removeAt(1);

	} else {

		geocoder.geocode({
			address: place,
			region: 'jp'
		}, 
		function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {

				// 結果の表示範囲。結果が１つとは限らないので、LatLngBoundsで用意。
				var bounds = new google.maps.LatLngBounds();

				for (var i in results) {
					if (results[i].geometry) {

						// 緯度経度を取得
						var latlng = results[i].geometry.location;
	
						// 住所を取得(日本の場合だけ「日本, 」を削除)
						var address = results[0].formatted_address.replace(/^日本, /, '');

						// 検索結果地が含まれるように範囲を拡大
						//bounds.extend(latlng);

						marker2.setMap(null);
						marker2 = new google.maps.Marker({
						position: latlng,
						map: map
						});
					}
				}

				// 範囲を移動
				//map.fitBounds(bounds);
				map.setCenter(latlng);
				map.setZoom(20);

				var path = poly.getPath();
				path.removeAt(1);

			} else if (status == google.maps.GeocoderStatus.ERROR) {
				alert("サーバとの通信時に何らかのエラーが発生しました。再度検索して下さい。");
			} else {
				alert("エラーが発生しました。再度検索して下さい。");
			}
		});
	}
}

//-----------------------------------------------
//  逆ジオコーディング
//-----------------------------------------------
function getAddress(latlng, id) {

  // ジオコーダのコンストラクタ
  var geocoder = new google.maps.Geocoder();

  // geocodeリクエストを実行。
  // 第１引数はGeocoderRequest。緯度経度⇒住所の変換時はlatLngプロパティを入れればOK。
  // 第２引数はコールバック関数。
  geocoder.geocode({
    latLng: latlng
  }, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      // results.length > 1 で返ってくる場合もありますが・・・。
      if (results[0].geometry) {

          // 住所を取得(日本の場合だけ「日本, 」を削除)
          var address = results[0].formatted_address.replace(/^日本, /, '');

		  if (id == 1) {
			  $('#addr').html(address);
		  } else {
			  $('#addr2').html(address);
		  }

      }
    } else if (status == google.maps.GeocoderStatus.ERROR) {
      alert("サーバとの通信時に何らかのエラーが発生しました。再度検索して下さい。");
    } else {
      alert("エラーが発生しました。再度検索して下さい。");
    }
  });
}

//-----------------------------------------------
//  印刷画面へ
//-----------------------------------------------
function submit_page() {
	$("#frm").attr("target", "_blank");
	$("#frm").submit();
}

