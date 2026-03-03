/**
 * CloudFront Viewer Request Function
 * ステージング/本番のディストリビューションに紐づける
 *
 * /stock/assets/csv/*, /stock/assets/image/* を /assets/* にリライトし stock-assets へ。
 * ビルド成果物(.js/.css)は /stock/* で stock バケットへ。
 *
 * 必要なビヘイビア（/stock/* より前）:
 *   /stock/assets/csv/*  → stock-assets（関数紐づけ）
 *   /stock/assets/image/* → stock-assets（関数紐づけ）
 *   /assets/* は削除
 */
function handler(event) {
  var r = event.request;
  var uri = r.uri || '/';
  var hasExt = /\.[^/]+$/.test(uri);

  if (uri === '/' || uri === '/index.html' || uri === '/login') {
    return { statusCode: 302, headers: { location: { value: '/auth/' } } };
  }
  if (uri === '/select' || uri === '/select/') {
    return { statusCode: 302, headers: { location: { value: '/auth/select' } } };
  }

  if (uri === '/auth')  return { statusCode: 302, headers: { location: { value: '/auth/' } } };
  if (uri === '/hub')   return { statusCode: 302, headers: { location: { value: '/hub/' } } };
  if (uri === '/map')   return { statusCode: 302, headers: { location: { value: '/map/' } } };
  if (uri === '/stock') return { statusCode: 302, headers: { location: { value: '/stock/' } } };

  // /stock/assets/csv/*, /stock/assets/image/* → /assets/* (stock-assets バケット用)
  if (uri.startsWith('/stock/assets/')) {
    r.uri = uri.replace('/stock/assets/', '/assets/');
    return r;
  }

  if (uri.startsWith('/auth/')  && !hasExt) { r.uri = '/auth/index.html';  return r; }
  if (uri.startsWith('/hub/')   && !hasExt) { r.uri = '/hub/index.html';   return r; }
  if (uri.startsWith('/map/')   && !hasExt) { r.uri = '/map/index.html';   return r; }
  if (uri.startsWith('/stock/') && !hasExt) { r.uri = '/stock/index.html'; return r; }

  return r;
}
