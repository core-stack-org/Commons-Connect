export default function getOdkUrlForScreen(screen, step, latlong, settlement_name, settlement_id, block_name, plan_id, plan_name, crop_id, maintain = false, userLatLong, isFeedback = false){

    if(userLatLong === null){
        userLatLong = [0,0]
    }
    let odk_url = ""
    plan_name = encodeURIComponent(plan_name.toLowerCase());

    if(screen === "Resource_mapping" && step === 0){
        odk_url = `${import.meta.env.VITE_ODK_ADD_SETTLEMENT}$zzXyj!5bZs6Q20MejPCDCdNmX7IO9MqzRB6DkJ$PEOpl`+ "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Resource_mapping" && step === 1){
        odk_url = `${import.meta.env.VITE_ODK_ADD_WELL}$OA0uqHioc3xYYZ8lNwrar` + "&d[/data/GPS_point/point_mapappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/hamlet_id]=" + settlement_id + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/beneficiary_settlement]=" + settlement_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/plan_name]=" + plan_name + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Resource_mapping" && step === 2){
        odk_url = `${import.meta.env.VITE_ODK_ADD_WATERSTRUCTURE}` + "&d[/data/GPS_point/point_mapappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/hamlet_id]=" + settlement_id + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/beneficiary_settlement]=" + settlement_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/plan_name]=" + plan_name + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Resource_mapping" && step > 2){
        odk_url = `${import.meta.env.VITE_ODK_CROP_GRID}$smauFD3` + "&d[/data/hamlet_id]=" + settlement_id + "&d[/data/crop_Grid_id]=" + crop_id + "&d[/data/beneficiary_settlement]=" + settlement_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/plan_name]=" + plan_name + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Groundwater" && step === 1 && !maintain && !isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_GROUNDWATER_BUILD_RECHARGE}$seU5QjKkgGjdav$pga66iH972V93scb8BxwvuBuQVxIUxLo$gf8F` + "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/plan_name]=" + plan_name + "&d[/data/beneficiary_settlement]=" + settlement_name +"&d[/data/corresponding_work_id]=" + "007101" + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Groundwater" && step === 1 && maintain && !isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_GROUNDWATER_PROVIDE_MAINTAIN}`+ "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/beneficiary_settlement]=" + settlement_name + "&d[/data/corresponding_work_id]=" + "0001829" + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Groundwater" && isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_GROUNDWATER_PROVIDE_FEEDBACK}` + "$m7z2cCyJYE5bhwFHWa4$vJNmVNQ7$YpHkMUqCyM!8YC0$GIJGQYnH6nWrFQ1k"
    }

    else if(screen === "SurfaceWater" && !maintain && !isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_SURFACEWATER_BODIES}` + "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/beneficiary_settlement]=" + settlement_name
    }

    else if(screen === "SurfaceWater" && maintain && !isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_SURFACEWATER_BODIES_MAINTAIN}` + "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/beneficiary_settlement]=" + settlement_name
    }

    else if(screen === "SurfaceWater" && isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_SURFACEWATER_BODIES_FEEDBACK}` + "$DnSOQUBn4156isxk2IyJ2WKRz9W8PS!IfiNp4pSFFSpF3qBITGpfY"
    }

    else if(screen === "Agriculture" && !maintain && !isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_AGRICULTURE_WORK}` + "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/beneficiary_settlement]=" + settlement_name 
    }

    else if(screen === "Agriculture" && maintain && !isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_AGRICULTURE_MAINTAIN}` + "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/beneficiary_settlement]=" + settlement_name 
    }

    else if(screen === "Agriculture" && isFeedback){
        odk_url = `${import.meta.env.VITE_ODK_AGRICULTURE_FEEDBACK}` + "$yAwLAzsh9W$5pkFSxzKWIEDJ37IZHBv7DV2E8SXX"
    }

    else if(screen === "Livelihood"){
        odk_url = `${import.meta.env.VITE_ODK_ADD_LIVELIHOOD}` + "&d[/data/GPS_point/point_mapappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/user_latlon]=" + userLatLong[0].toString() + "," + userLatLong[1].toString() + "&d[/data/beneficiary_settlement]=" + settlement_name + "&d[/data/meta/instanceID]="
    }

    console.log(odk_url)

    return odk_url;
}