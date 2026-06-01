import { useState } from "react";
import { MERCH_TEMPLATES, MERCH_EDITIONS, getPressingVariants, isPhysicalFormat, fmtMoney } from "../../gameLogic";
import type { MerchType } from "../../gameLogic";

export default function MerchDrawer({ state, doAddMerchItem, onClose }: any) {
  const [type, setType] = useState<MerchType>("T-Shirt");
  const [releaseId, setReleaseId] = useState("");
  const [price, setPrice] = useState(25);
  const [variant, setVariant] = useState("");
  const [edition, setEdition] = useState("Standard");

  const tmpl = MERCH_TEMPLATES.find((t: any) => t.type === type)!;
  const variants = getPressingVariants(type);
  const editions = MERCH_EDITIONS;
  const selectedVar = variants.find((v: any) => v.name === variant) || variants[0];
  const selectedEd = editions.find((e: any) => e.name === edition) || editions[0];
  const finalCost = tmpl.baseCost + (selectedVar?.costMod ?? 0) + (selectedEd?.costMod ?? 0);
  const finalPrice = tmpl.basePrice + (selectedVar?.priceMod ?? 0) + (selectedEd?.priceMod ?? 0);

  const submit = () => {
    doAddMerchItem(type, releaseId || null, "", price || finalPrice, {
      variantName: selectedVar?.name, variantColor: selectedVar?.color, editionLabel: selectedEd?.name,
      bonusCost: (selectedVar?.costMod ?? 0) + (selectedEd?.costMod ?? 0),
      bonusPrice: (selectedVar?.priceMod ?? 0) + (selectedEd?.priceMod ?? 0),
    });
    onClose();
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-handle" />
        <div className="drawer-title">New Merch</div>
        <div className="field">
          <label>Type</label>
          <div className="g2">
            {MERCH_TEMPLATES.map((t: any) => (
              <button key={t.type} className={`btn btn-sm ${type === t.type ? "btn-lime" : ""}`} onClick={() => setType(t.type)}>
                {t.emoji} {t.type}
              </button>
            ))}
          </div>
        </div>
        {tmpl.needsRelease && (
          <div className="field">
            <label>Tie to Release</label>
            <select value={releaseId} onChange={(e) => setReleaseId(e.target.value)}>
              <option value="">General / No tie</option>
              {state.catalog.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
        )}
        {isPhysicalFormat(type) && variants.length > 0 && (
          <div className="field">
            <label>Variant</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {variants.map((v: any) => (
                <button key={v.name} className={`btn btn-sm ${variant === v.name ? "btn-lime" : ""}`} onClick={() => setVariant(v.name)}>
                  <span style={{ display: "inline-block", width: 10, height: 10, background: v.color, borderRadius: 10, marginRight: 4 }} />
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {isPhysicalFormat(type) && (
          <div className="field">
            <label>Edition</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {editions.map((e: any) => (
                <button key={e.name} className={`btn btn-sm ${edition === e.name ? "btn-lime" : ""}`} onClick={() => setEdition(e.name)}>
                  {e.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="field">
          <label>Price</label>
          <input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value) || 0)} />
          <div className="tip-text">Suggested: {fmtMoney(finalPrice)} • Cost: {fmtMoney(finalCost)}</div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-lime" onClick={submit}>List Item</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
