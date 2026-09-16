type PageResult<T> = { data:T[]|null; error:{message:string}|null }

/** Supabase limits a single select response to 1,000 rows. Fetch every page explicitly. */
export async function fetchAllRows<T>(load:(from:number,to:number)=>PromiseLike<PageResult<T>>, pageSize=1000) {
  const rows:T[]=[]
  for(let from=0;;from+=pageSize){
    const {data,error}=await load(from,from+pageSize-1)
    if(error)throw new Error(error.message)
    const page=data??[]
    rows.push(...page)
    if(page.length<pageSize)return rows
  }
}
