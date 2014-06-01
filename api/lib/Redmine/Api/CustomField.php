<?php

namespace Redmine\Api;

/**
 * Listing custom fields
 *
 * @link   http://www.redmine.org/projects/redmine/wiki/Rest_CustomFields
 * @author Kevin Saliou <kevin at saliou dot name>
 */
class CustomField extends AbstractApi
{
    private $customFields = array();

    /**
     * List custom fields
     * @link http://www.redmine.org/projects/redmine/wiki/Rest_CustomFields#GET
     *
     * @param  array $params optional parameters to be passed to the api (offset, limit, ...)
     * @return array list of custom fields found
     */
    public function all(array $params = array())
    {
        $this->customFields = $this->retrieveAll('/custom_fields.json', $params);

        return $this->customFields;
    }

    /**
     * Returns an array of custom fields with name/id pairs
     *
     * @param  boolean $forceUpdate to force the update of the custom fields var
     * @return array   list of custom fields (id => name)
     */
    public function listing($forceUpdate = false)
    {
        if (empty($this->customFields)) {
            $this->all();
        }
        $ret = array();
        foreach ($this->customFields['custom_fields'] as $e) {
            $ret[$e['name']] = (int) $e['id'];
        }

        return $ret;
    }

    /**
     * Get a tracket id given its name
     *
     * @param  string|int $name customer field name
     * @return int|false
     */
    public function getIdByName($name)
    {
        $arr = $this->listing();
        if (!isset($arr[$name])) {
            return false;
        }

        return $arr[(string) $name];
    }
}
