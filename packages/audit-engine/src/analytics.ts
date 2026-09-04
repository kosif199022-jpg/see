export interface RatioResult {
  name:string;
  value:number;
}

export function calculateLiquidity(currentAssets:number,currentLiabilities:number):RatioResult {
  return {name:'current_ratio',value: currentLiabilities===0?0:currentAssets/currentLiabilities};
}
