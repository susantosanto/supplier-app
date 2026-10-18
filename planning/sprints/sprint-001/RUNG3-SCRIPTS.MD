# RUNG-3 Sprint 001 — Snippet copy-paste editor online (proyek 1JcK...)

Buka https://script.google.com/d/1JcK4qDpfvEIoCOWjJFumFHK58Qj48OZPR81aVDR5EuVnmkQbSZSIXMOf/edit
Pilih fungsi → Run → lihat tab Executions / Log. Tempel output ke chat builder.

## A3 — init 2x + 11 tab
```js
function rungA3() {
  initSpreadsheet(); initSpreadsheet();
  console.log(SpreadsheetApp.getActive().getSheets().map(s=>s.getName()).join(','));
  var cfg = SpreadsheetApp.getActive().getSheetByName('Config');
  console.log('Config rows=' + cfg.getLastRow());
}
```
Expect: Config,Log,Toko,SPPG,Item,Pembelian,PembayaranBeli,Pengiriman,PembayaranJual,PiutangBaris,Opname + Config rows=5 (1 header + 4 seed)

## A4 — guard fail-closed
```js
function rungA4() {
  try { getMaster(); console.log('FAIL-OPEN'); } catch(e){ console.log(e.message); }
  console.log(JSON.stringify(setupOwner_()));
  console.log('master keys=' + Object.keys(getMaster()).join(','));
}
```
Expect baris 1: AKSES_DITOLAK (sebelum setup), lalu owner email, lalu master keys=toko,sppg,item

## A5 — master toko
```js
function rungA5() {
  var t = saveMaster('toko',{nama:'Toko Uji', kontak:'0812'});
  console.log('id=' + t.id);
  try { saveMaster('toko',{nama:'TOKO UJI'}); } catch(e){ console.log(e.message); }
}
```
Expect: id=TK-... lalu NAMA_DUPLIKAT

## A6 — pembelian tunai + tempo + tolak
```js
function rungA6(tokoId) {
  var itm = saveMaster('item',{nama:'Beras', satuanDasar:'sak', batasStokMin:10});
  console.log('item=' + itm.id);
  var a = createPembelian({tokoId:tokoId, itemId:itm.id, qty:5, satuan:'sak', hargaBeli:300000, metode:'tunai'});
  var b = createPembelian({tokoId:tokoId, itemId:itm.id, qty:10, satuan:'sak', hargaBeli:310000, metode:'tempo'});
  console.log('a=' + a.id + ' b=' + b.id);
  try { createPembelian({tokoId:tokoId, itemId:itm.id, qty:3, satuan:'sak', hargaBeli:0, metode:'tunai'}); } catch(e){ console.log(e.message); }
  console.log('count=' + listPembelian({}).length);
}
```
Panggil: rungA6('TK-...dari A5...'). Expect: HARGA_TIDAK_VALID + count=2

## A7 — bayar 50% + melebihi
```js
function rungA7(tokoId) {
  console.log(JSON.stringify(bayarHutang({tokoId:tokoId, jumlah:1550000})));
  try { bayarHutang({tokoId:tokoId, jumlah:2000000}); } catch(e){ console.log(e.message); }
}
```
Expect: alokasi 1550000 lalu MELEBIHI_SISA

## A8 — hutang
```js
function rungA8() { console.log(JSON.stringify(getHutangToko())); }
```
Expect: [{"toko":"Toko Uji","totalSisa":1550000,"jumlahFaktur":1,...}]
