UPDATE profiles SET data=json_set(data,'$.photoPending',json('false')) WHERE json_extract(data,'$.photoKey') IS NOT NULL AND json_extract(data,'$.photoPending')=1;
