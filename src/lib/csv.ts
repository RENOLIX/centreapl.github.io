export type CsvClient = { firstName:string; lastName:string; phone:string; email:string; city:string; phone2:string;address:string;commune:string;wilaya:string;total:string;product:string }
const aliases:Record<string,string[]>={
  firstName:['prenom','first name','firstname'],
  lastName:['nom','nom de famille','last name','lastname'],
  fullName:['client','nom complet','contact','client nom'],
  phone:['tel 1','tel1','telephone 1','telephone','tel','phone','mobile','numero','numero de telephone','numero telephone'],
  phone2:['tel 2','tel2','telephone 2','deuxieme telephone','telephone secondaire'],
  email:['email','e mail','mail'],
  city:['ville','city'],
  address:['adresse','address'],
  commune:['commune','municipalite'],
  wilaya:['wilaya','province','departement'],
  total:['total','montant','prix total'],
  product:['produit','produits','product','products','article','articles'],
}
function key(value:string){return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_-]+/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
export function parseClientRows(rows:Record<string,string>[]){const accepted:CsvClient[]=[];const rejected:{row:number;reason:string}[]=[];const seen=new Set<string>(); rows.forEach((row,index)=>{const normalized=Object.fromEntries(Object.entries(row).map(([k,v])=>[key(k),String(v??'').trim()])); const get=(field:string)=>{const found=aliases[field].find(a=>normalized[a]);return found?normalized[found]:''}; let phone=get('phone');let phone2=get('phone2');let firstName=get('firstName');let lastName=get('lastName');const fullName=get('fullName');if(!firstName&&fullName){const parts=fullName.split(/\s+/).filter(Boolean);firstName=parts.shift()||'';lastName=parts.join(' ')||'Client'}lastName=lastName||'Client';if(/^\d{9}$/.test(phone))phone=`0${phone}`;if(/^\d{9}$/.test(phone2))phone2=`0${phone2}`;if(!firstName&&!phone){rejected.push({row:index+2,reason:'Colonnes client et tel 1 absentes ou vides'});return}if(!firstName){rejected.push({row:index+2,reason:'Client absent'});return}if(!phone){rejected.push({row:index+2,reason:'Tel 1 absent'});return} const dedupe=phone.replace(/\D/g,'');if(seen.has(dedupe)){rejected.push({row:index+2,reason:'Tel 1 en doublon dans le fichier'});return}seen.add(dedupe);const commune=get('commune');accepted.push({firstName,lastName,phone,email:get('email'),city:get('city')||commune,phone2,address:get('address'),commune,wilaya:get('wilaya'),total:get('total'),product:get('product')})}); return {accepted,rejected} }
