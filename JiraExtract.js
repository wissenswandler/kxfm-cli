export default class JiraExtract
{
   /*
    * recursively search for first (parent) dir name containing a dot, starting at the current workding dir,
    */
    static find_instance_name(dir_parts_array)
    {
        const dir_name = dir_parts_array[dir_parts_array.length - 1];
        if (dir_name.includes('.'))
        {
            return dir_name.split('.')[0];
        }
        else if (dir_parts_array.length === 1)
        {
            return null;
        }
        else
        {
            return JiraExtract.find_instance_name(dir_parts_array.slice(0, dir_parts_array.length - 1));
        }
    }
}
