import sys, os
import zipfile
from datetime import datetime
from bson import ObjectId
from tempfile import mktemp
from subprocess import call
import logging

class ImportExportService(object):
  def __init__(self, db):
    self.log = logging.getLogger(__name__)
    self.db = db
    self.ie_collection = self.db.import_export_collection

  def search(self, tenant_id):
    if tenant_id is not None and len(tenant_id) > 0:
      query = {"tenant_id": ObjectId(tenant_id)}
      values = [x for x in self.ie_collection.find(query).sort("created_at", -1)]
    else:
      values = [x for x in self.ie_collection.sort("created_at", -1)]
    return values

  def export(self, tenant_id, export_data_folder=None):
    outfile, tbl_cnt, tot_size = self.gen_cmd(export_data_folder)
    item = {}
    item['tenant_id'] = ObjectId(tenant_id)
    item['table_count'] = tbl_cnt
    item['size'] = tot_size
    item['url'] = outfile
    item['created_at'] = datetime.now()
    item['status'] = True
    res = self.ie_collection.save(item)
    return res

  def gen_cmd(self, export_data_folder):
    tot_size = 0
    files = []
    self.log.info("Started exporting db collections")

    for col_name in self.db.collection_names():
      if col_name in ['system.indexes']:
        continue
      outfile = mktemp(dir=export_data_folder)
      cmd = ["mongoexport","--db",self.db.name,'--collection', col_name ,"--out",outfile]
      self.log.info(' '.join(cmd))
      call(cmd)
      tot_size = tot_size + os.path.getsize(outfile)
      files.append(outfile)

    zfile = mktemp(dir=export_data_folder) + ".zip"
    with zipfile.ZipFile(zfile, 'a') as zip:
      for x in files:
        zip.write(x)

    self.log.info("Created zip file... %s" % zfile)

    for x in files:
      os.unlink(x)
    self.log.info("Deleted individual data files")

    return zfile, len(files), tot_size
