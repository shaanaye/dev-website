import os
from ga4 import GA4RealTimeReport

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = "C:\\Users\\shaan\\Desktop\\Google Analytics API\\shaanaye-developer-website-f93c451ed36c.json"

property_id = '387459505'

lst_dimension = ['country', 'deviceCategory', 'streamName']
lst_metrics = ['activeUsers']

ga4_realtime = GA4RealTimeReport(property_id)

response = ga4_realtime.query_report(
    lst_dimension, lst_metrics, 10, True
)

print(response)