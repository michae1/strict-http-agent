echo "Date Time, Transactions, Elapsed time, Data transferred, Response time, Transaction rate, Throughput, Concurrency, Successful transactions, Failed transactions" > ./run_log
vagrant reload
vagrant ssh -c 'sudo start node-server'
sleep 5
siege -b -c 200 -r 10 -f urls_usual.txt -v -R .siegerc -m usual
sleep 5

sleep 5
siege -b -c 200 -r 10 -f urls_stricted.txt -v -R .siegerc -m strict
sleep 5

sleep 5
siege -b -c 200 -r 10 -f urls_stricted_ttl.txt -v -R .siegerc -m strict_ttl
