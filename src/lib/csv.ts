export type CsvClient = { firstName:string; lastName:string; phone:string; email:string; city:string }
const aliases:Record<string,string[]>={
  firstName:['prenom','first name','firstname'],
  lastName:['nom','nom de famille','last name','lastname'],
  phone:['telephone','tel','phone','mobile','numero','numero de telephone','numero telephone'],
  email:['email','e mail','mail'],
  city:['ville','city','commune'],
}
function key(value:string){return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[_-]+/g,' ').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
export function parseClientRows(rows:Record<string,string>[]){const accepted:CsvClient[]=[];const rejected:{row:number;reason:string}[]=[];const seen=new Set<string>(); rows.forEach((row,index)=>{const normalized=Object.fromEntries(Object.entries(row).map(([k,v])=>[key(k),String(v??'').trim()])); const get=(field:string)=>{const found=aliases[field].find(a=>normalized[a]);return found?normalized[found]:''}; let phone=get('phone'); const firstName=get('firstName'); const lastName=get('lastName')||'Client';if(/^\d{9}$/.test(phone))phone=`0${phone}`;if(!firstName&&!phone){rejected.push({row:index+2,reason:'Colonnes prénom et téléphone absentes ou vides'});return}if(!firstName){rejected.push({row:index+2,reason:'Prénom absent'});return}if(!phone){rejected.push({row:index+2,reason:'Téléphone absent'});return} const dedupe=phone.replace(/\D/g,'');if(seen.has(dedupe)){rejected.push({row:index+2,reason:'Téléphone en doublon dans le fichier'});return}seen.add(dedupe);accepted.push({firstName,lastName,phone,email:get('email'),city:get('city')})}); return {accepted,rejected} }
