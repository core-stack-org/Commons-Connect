export default function getOdkUrlForScreen(
  screen,
  step,
  latlong,
  settlement_name,
  settlement_id,
  block_name,
  plan_id,
  plan_name,
  crop_id,
  maintain = false,
  userLatLong,
  isFeedback = false,
) {
  if (userLatLong === null) {
    userLatLong = [0, 0];
  }
  let odk_url = "";
  plan_name = encodeURIComponent((plan_name || "").toLowerCase());

  if (screen === "Resource_mapping" && step === 0) {
    odk_url =
      "https://odk.core-stack.org/-/single/AOV0NchVMqkZVpCgZyWwJylCdnOIXwi?st=TBomGhMfOetjH6thCwy$zzXyj!5bZs6Q20MejPCDCdNmX7IO9MqzRB6DkJ$PEOpl" + // settlement form
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/meta/instanceID]=";
  } else if (screen === "Resource_mapping" && step === 1) {
    odk_url =
      "https://odk.core-stack.org/f/iB707x5CMdklU3QbjvopaeNlBiG3WLc?st=19BTDQ31numlgTB5vTjZZZxrgPRtYv1TZtNw2662Md$OA0uqHioc3xYYZ8lNwrar" + // well form
      "&d[/data/GPS_point/point_mapappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/hamlet_id]=" +
      settlement_id +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/meta/instanceID]=";
  } else if (screen === "Resource_mapping" && step === 2) {
    odk_url =
      "https://odk.core-stack.org/-/single/JlbwXkMvol1fIoCRpMN07AxbZawhW2e?st=XidlpvnHZfCMxcDlxXr4Jbxr6eKwtsclHZki7s9pbiIb14rPh7uNYCalXHs0M6ht" + // water structure form
      "&d[/data/GPS_point/point_mapappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/hamlet_id]=" +
      settlement_id +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/meta/instanceID]=";
  } else if (screen === "Resource_mapping" && step > 2) {
    odk_url =
      "https://odk.core-stack.org/-/single/Jg7MnKeZ1W9oQkwlDb2iCV7BhXgXDN8?st=z44571PIPvbF2lpzcaRZruzCVIucT8Agm!ZfbrhUxUwhY6l78V8Vs5P!$smauFD3" + // cropping pattern form
      "&d[/data/hamlet_id]=" +
      settlement_id +
      "&d[/data/crop_Grid_id]=" +
      crop_id +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/meta/instanceID]=";
  } else if (
    screen === "Groundwater" &&
    step === 1 &&
    !maintain &&
    !isFeedback
  ) {
    odk_url =
      "https://odk.core-stack.org/-/single/ecGG8zVLDoj4xRDUJyUE69w4dVMLPxe?st=dzcP1R16z3P$seU5QjKkgGjdav$pga66iH972V93scb8BxwvuBuQVxIUxLo$gf8F" + // recharge structureform
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name +
      "&d[/data/corresponding_work_id]=" +
      "007101" +
      "&d[/data/meta/instanceID]=";
  } else if (
    screen === "Groundwater" &&
    step === 1 &&
    maintain &&
    !isFeedback
  ) {
    odk_url =
      "https://odk.core-stack.org/-/single/URUgyGL068WK4Y6bh1ej0zslzgSuRJ5?st=HC0EoYBiODabcQ3y6GJQ5EnjsMtKbiwJWA2ZRSptVG!C0PgMUX6wu4N29kYp9NF8" + // maintenance recharge structure form
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name +
      "&d[/data/corresponding_work_id]=" +
      "0001829" +
      "&d[/data/meta/instanceID]=";
  } else if (
    screen === "Groundwater" &&
    step === 2 &&
    !maintain &&
    !isFeedback
  ) {
    odk_url =
      "https://odk.core-stack.org/-/single/ecGG8zVLDoj4xRDUJyUE69w4dVMLPxe?st=dzcP1R16z3P$seU5QjKkgGjdav$pga66iH972V93scb8BxwvuBuQVxIUxLo$gf8F" + // recharge structure form
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name +
      "&d[/data/corresponding_work_id]=" +
      "007101" +
      "&d[/data/meta/instanceID]=";
  } else if (screen === "Groundwater" && isFeedback) {
    odk_url =
      "https://odk.core-stack.org/-/single/IUkvzpDp4lUuCZUJUCLqScMcc18uSzT?st=ON$m7z2cCyJYE5bhwFHWa4$vJNmVNQ7$YpHkMUqCyM!8YC0$GIJGQYnH6nWrFQ1k"; // feedback recharge structure form
  } else if (screen === "SurfaceWater" && !maintain && !isFeedback) {
    odk_url =
      "https://odk.core-stack.org/-/single/G5z8BfpmN7rD5T0Mng3lSPdRmUUVSmD?st=jCR5wJ!ZjU5!yrQt0e7KoV9eOmvHgKiLwRIiL40IuoZ53yQ8VNH4yb!N7k0Of7Tp" + // surface water bodies form
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name;
  } else if (screen === "SurfaceWater" && maintain && !isFeedback) {
    odk_url =
      "https://odk.core-stack.org/-/single/mnx5heyWfp6Hjz629gd7jsmo03QzGOW?st=H04pS4tz1fE9nOREeKEFC0FrvF8OdFeE7czhpOVTWJQ2ehC!IFP7fke4jg!ZQf3V" + // maintenance surface water bodies remote sensed form
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name;
  } else if (screen === "SurfaceWater" && isFeedback) {
    odk_url =
      "https://odk.core-stack.org/-/single/x8UqSCODwgUUffe4TdkUv0v4TexOocG?st=BwL42ECSlE$DnSOQUBn4156isxk2IyJ2WKRz9W8PS!IfiNp4pSFFSpF3qBITGpfY"; // feedback surface water bodies form
  } else if (screen === "Agriculture" && !maintain && !isFeedback) {
    odk_url =
      "https://odk.core-stack.org/-/single/FwXC1tLB8dRyaSE5jssmUqeC1IFebbQ?st=2sWYsnvVeFdkr12RHgZA6IzyYV1cIqpY5n4thlMP3AxQ0vS!ilXolTVwGSy7Eo9P" + // agriculture work form
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name;
  } else if (screen === "Agriculture" && maintain && !isFeedback) {
    odk_url =
      "https://odk.core-stack.org/-/single/PqmivgmYiOzdRjKkHRFfvI7RZY62nbb?st=Uffu7PhVnyd0vmikK64kDVZEpS7cV41!ymiq2lIrkWSKJTSUeQHwTyUP6mhn2typ" + // maintenance agriculture work form
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name;
  } else if (screen === "Agriculture" && isFeedback) {
    odk_url =
      "https://odk.core-stack.org/-/single/tDBfbsyi8PwukkWJtijMur5xipWzE4A?st=4CQ8YLJgpsTpICSK8P!yv4Z$yAwLAzsh9W$5pkFSxzKWIEDJ37IZHBv7DV2E8SXX"; // feedback agriculture work form
  } else if (screen === "Livelihood") {
    odk_url =
      "https://odk.core-stack.org/-/single/f3FNR4k440c3O2mIid3bapu5GMrXeM1?st=1PZrxqQxTnyseflapUolLDE6a5U1rw98FDgTuiORL7Of532h3zsnV!fnhA2ZbL1w" + // livelihood form
      "&d[/data/GPS_point/point_mapappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name +
      "&d[/data/meta/instanceID]=";
  } else if (screen === "Agrohorticulture") {
    odk_url =
      "https://odk.core-stack.org/-/single/42RMnD3mfbjOqBTqm5SmY3oPhEzuHJH?st=a!Vg65gANI!xeQ1BKWPOwnynOKiWmeu1fmbIS8e5uAoZUKKrcn!jMun$I$YU!OA5" + // agrohorticulture plantation proposal form
      "&d[/data/GPS_point/point_mapsappearance]=" +
      latlong[1].toString() +
      "%20" +
      latlong[0].toString() +
      "&d[/data/block_name]=" +
      block_name +
      "&d[/data/plan_id]=" +
      plan_id +
      "&d[/data/plan_name]=" +
      plan_name +
      "&d[/data/user_latlon]=" +
      userLatLong[0].toString() +
      "," +
      userLatLong[1].toString() +
      "&d[/data/beneficiary_settlement]=" +
      settlement_name +
      "&d[/data/meta/instanceID]=";
  }

  return odk_url;
}
