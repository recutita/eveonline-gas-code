function FETCH_FITTED(url,insurance_enable=0) {
  if(url){
    //get zkill
    const killId = url.split('/')[4];
    const endpoint = `https://zkillboard.com/api/kills/killID/${killId}/`;
    const response = UrlFetchApp.fetch(endpoint, {
      muteHttpExceptions: true
    })
    const data = JSON.parse(response.getContentText());

    if(insurance_enable) {
      //get killmail
      const hash = data[0].zkb.hash;
      const killmailEndpoint = `https://esi.evetech.net/latest/killmails/${killId}/${hash}/?datasource=tranquility`;
      const killmailResponse = UrlFetchApp.fetch(killmailEndpoint, {
      muteHttpExceptions: true
      })
      const killmailData = JSON.parse(killmailResponse.getContentText());
      const shipId = killmailData.victim.ship_type_id;

      //get insuranceData
      let insuranceData;
      const cache = CacheService.getScriptCache();
      const cachedData = cache.get("insuranceData");
      if(!cachedData){
        //import from esi
        const insuranceEndpoint = "https://esi.evetech.net/latest/insurance/prices/?datasource=tranquility&language=en"
        const insuranceResponse = UrlFetchApp.fetch(insuranceEndpoint, {
          muteHttpExceptions: true
        })
        const insuranceJSON = JSON.parse(insuranceResponse.getContentText());
        const platinumData = {};
        for(const item of insuranceJSON){
          const levelPlatinum = item.levels.find(level => level.name === "Platinum");
          platinumData[item.type_id] = levelPlatinum;
        };
        cache.put("insuranceData", JSON.stringify(platinumData),21600);
        insuranceData = platinumData;
      }else{
        //import from cache
        insuranceData = JSON.parse(cachedData);
      }

      //retrun Ship+Fit + cost - payout
      const insurance = insuranceData[shipId];
      return data[0].zkb.fittedValue+insurance.cost-insurance.payout;
    }else{
      return data[0].zkb.fittedValue;
    }
  }else{
  return "";
  }
}

