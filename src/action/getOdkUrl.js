export default function getOdkUrlForScreen(screen, step, latlong, settlement_name, settlement_id, block_name, plan_id, plan_name, crop_id, maintain = false){

    let odk_url = ""
    plan_name = encodeURIComponent(plan_name.toLowerCase());

    if(screen === "Resource_mapping" && step === 0){
        odk_url = `${import.meta.env.VITE_ODK_ADD_SETTLEMENT}`+ "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Resource_mapping" && step === 1){
        odk_url = `${import.meta.env.VITE_ODK_ADD_WELL}` + "&d[/data/GPS_point/point_mapappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/hamlet_id]=" + settlement_id + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/beneficiary_settlement]=" + settlement_name + "&d[/data/plan_name]=" + plan_name + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Resource_mapping" && step === 2){
        odk_url = `${import.meta.env.VITE_ODK_ADD_WATERSTRUCTURE}` + "&d[/data/GPS_point/point_mapappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/hamlet_id]=" + settlement_id + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/beneficiary_settlement]=" + settlement_name + "&d[/data/plan_name]=" + plan_name + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Resource_mapping" && step > 2){
        odk_url = `${import.meta.env.VITE_ODK_CROP_GRID}` + "&d[/data/hamlet_id]=" + settlement_id + "&d[/data/crop_Grid_id]=" + crop_id + "&d[/data/beneficiary_settlement]=" + settlement_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/meta/instanceID]="
    }

    else if(screen === "Groundwater" && step === 1 && !maintain){
        odk_url = `${import.meta.env.VITE_ODK_GROUNDWATER_BUILD_RECHARGE}` + "$kleMu$UIs3176kF$8xt2PGgIMSDp5hDIg6Db" + "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/beneficiary_settlement]=" + settlement_name
    }

    else if(screen === "Groundwater" && step === 1 && maintain){
        odk_url = `${import.meta.env.VITE_ODK_GROUNDWATER_PROVIDE_MAINTAIN}`+ "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/beneficiary_settlement]=" + settlement_name
    }

    else if(screen === "SurfaceWater"){
        odk_url = `${import.meta.env.VITE_ODK_SURFACEWATER_BODIES}` + `$zsF8xTTrt3ONGuK6pvM4P!cpQLoo` + "&d[/data/GPS_point/point_mapsappearance]=" + latlong[1].toString() + "%20" + latlong[0].toString() + "&d[/data/block_name]=" + block_name + "&d[/data/plan_id]=" + plan_id + "&d[/data/plan_name]=" + plan_name + "&d[/data/beneficiary_settlement]=" + settlement_name
    }

    console.log(odk_url)

    return odk_url;
}