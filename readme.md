# SSL Regen process

+ Scheduler (jobs) -> request ssl server
+ SSL server regens certs
+ SSl server checks if personal key matches key in request, if true:
+ SSl server sends certs to jobs server.
+ Jobs server saves certs in kubernetes secret